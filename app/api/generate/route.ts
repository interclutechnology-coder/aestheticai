import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 60;
import { z } from "zod";
import { GenerateRequestSchema } from "@/types";
import type { Outfit, Filters } from "@/types";
import { generateOutfits } from "@/lib/generator";

// ─── Retailer domains ─────────────────────────────────────────────────────────

const RETAILER_DOMAINS: Record<string, string> = {
  "Zara":              "zara.com",
  "H&M":               "hm.com",
  "Uniqlo":            "uniqlo.com",
  "Nike":              "nike.com",
  "ASOS":              "asos.com",
  "Nordstrom":         "nordstrom.com",
  "Anthropologie":     "anthropologie.com",
  "Mango":             "mango.com",
  "Free People":       "freepeople.com",
  "Banana Republic":   "bananarepublic.gap.com",
};

// URL path patterns that indicate a real product page (not search/category/homepage)
const NON_PRODUCT_PATH = /\/(search|collection|category|new-in|new_in|men$|women$|kids$|sale$|lookbook)\b/i;

function isProductPageUrl(url: string): boolean {
  if (!url || !url.startsWith("http")) return false;
  try {
    const { pathname } = new URL(url);
    if (pathname === "/" || pathname.length < 5) return false;
    if (NON_PRODUCT_PATH.test(pathname)) return false;
    return true;
  } catch {
    return false;
  }
}

// ─── Pass 2: Targeted per-item product search ─────────────────────────────────

async function findProductUrl(itemName: string, retailer: string): Promise<string> {
  const domain = RETAILER_DOMAINS[retailer];
  if (!domain || !process.env.TAVILY_API_KEY) {
    return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(retailer + " " + itemName)}`;
  }

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: `${itemName} ${retailer}`,
        search_depth: "basic",
        include_images: false,
        include_answer: false,
        max_results: 5,
        include_domains: [domain],
      }),
    });

    if (!res.ok) throw new Error("Tavily error");
    const data = await res.json();

    const results: { url?: string }[] = data.results ?? [];

    // Prefer a result whose URL looks like a product page
    const productPage = results.find((r) => isProductPageUrl(r.url ?? ""));
    if (productPage?.url) return productPage.url;

    // Fall back to any result from this retailer
    const anyResult = results.find((r) => r.url?.includes(domain));
    if (anyResult?.url) return anyResult.url;
  } catch {
    // fall through to Google Shopping fallback
  }

  // Last resort: Google Shopping search for this specific item
  return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(retailer + " " + itemName)}`;
}

// ─── Pass 1: Gemini designs outfits (names + retailers, no URLs) ──────────────

async function generateWithGemini(
  prompt: string,
  filters: Filters
): Promise<Outfit[]> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_AI_API_KEY not set");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const genderNote =
    filters.gender === "male"
      ? "All items must be menswear."
      : filters.gender === "female"
      ? "All items must be womenswear."
      : "Mix genders or use unisex items as appropriate.";

  const retailerNote =
    filters.retailers.length > 0
      ? `Only use these retailers: ${filters.retailers.join(", ")}.`
      : "Use real fashion retailers: Zara, H&M, Uniqlo, ASOS, Nike, Nordstrom, Anthropologie, Mango, Free People, or Banana Republic.";

  const budgetNote =
    filters.budgetMin > 0
      ? `Total outfit cost: $${filters.budgetMin}–$${filters.budgetMax}. Each item: $${Math.round(filters.budgetMin / 5)}–$${Math.round(filters.budgetMax * 0.55)}.`
      : `Total outfit cost: under $${filters.budgetMax}. Use realistic prices for each retailer.`;

  const geminiPrompt = `You are a professional fashion stylist. Design 5 complete, distinct outfits for this request.

USER REQUEST: "${prompt}"
BUDGET: ${budgetNote}
${genderNote}
${retailerNote}

Return ONLY a JSON array of exactly 5 outfits. No markdown, no explanation.

Each outfit:
{
  "title": "3-5 word catchy name",
  "reasoning": "1-2 sentences: vibe, why it works",
  "trending": false,
  "items": {
    "top": {
      "name": "Specific descriptive product name (e.g. 'Ivory Satin Slip Top', 'Black Ribbed Turtleneck')",
      "retailer": "Zara",
      "price": 39.90,
      "color": "ivory",
      "colorFamily": "white",
      "styleTags": ["minimalist"],
      "fit": "regular",
      "seasonTags": ["all"],
      "gender": "female"
    },
    "bottom": { same fields },
    "shoes": { same fields },
    "outerwear": { same fields, optional },
    "accessory": { same fields, optional }
  }
}

Rules:
- colorFamily: neutral | earth | blue | warm | cool | dark | white
- fit: slim | regular | oversized | relaxed | tailored | cropped | wide
- seasonTags: spring | summer | fall | winter | all
- gender: male | female | unisex
- outerwear and accessory are optional — only include if they fit the look and budget
- Product names must be SPECIFIC (fabric, cut, color — e.g. "Camel Wool Wrap Coat", not "coat")
- trending: true for 1-2 outfits
- Each outfit must be clearly different from the others`;

  // Retry on Gemini 429 (per-minute rate limit on free tier)
  let text = "";
  for (let attempt = 0; attempt <= 3; attempt++) {
    try {
      const result = await model.generateContent(geminiPrompt);
      text = result.response.text();
      break;
    } catch (err: unknown) {
      const msg = String((err as Error)?.message ?? "");
      const is429 = msg.includes("429") || msg.includes("Too Many Requests");
      if (!is429 || attempt === 3) throw err;
      const retryMatch = msg.match(/retry in ([\d.]+)s/);
      const waitMs = retryMatch ? Math.min(parseFloat(retryMatch[1]) * 1000 + 500, 20000) : 8000;
      console.log(`[generate] Gemini rate limited, waiting ${waitMs}ms (attempt ${attempt + 1})`);
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("Gemini returned no JSON");

  type RawItem = {
    name?: unknown; retailer?: unknown; price?: unknown; color?: unknown;
    colorFamily?: unknown; styleTags?: unknown; fit?: unknown;
    seasonTags?: unknown; gender?: unknown;
  };
  type RawOutfit = {
    title?: unknown; reasoning?: unknown; trending?: unknown;
    items?: { top?: RawItem; bottom?: RawItem; shoes?: RawItem; outerwear?: RawItem; accessory?: RawItem };
  };

  const raw = JSON.parse(jsonMatch[0]) as RawOutfit[];

  const COLOR_FAMILIES = new Set(["neutral","earth","blue","warm","cool","dark","white"]);
  const FITS          = new Set(["slim","regular","oversized","relaxed","tailored","cropped","wide"]);
  const GENDERS       = new Set(["male","female","unisex"]);
  const SEASONS       = new Set(["spring","summer","fall","winter","all"]);

  // Collect all items that need product URL searches
  const itemsToSearch: { outfitIdx: number; cat: string; name: string; retailer: string }[] = [];

  const validRaw = raw.filter((o) => o?.items?.top && o?.items?.bottom && o?.items?.shoes);
  if (validRaw.length === 0) throw new Error("No valid outfits from Gemini");

  validRaw.forEach((o, i) => {
    (["top","bottom","shoes","outerwear","accessory"] as const).forEach((cat) => {
      const item = o.items?.[cat];
      if (item) {
        itemsToSearch.push({
          outfitIdx: i,
          cat,
          name: String(item.name ?? `${cat} item`),
          retailer: String(item.retailer ?? "Zara"),
        });
      }
    });
  });

  // Pass 2: find direct product URLs for every item in parallel
  console.log(`[generate] Searching ${itemsToSearch.length} product URLs in parallel...`);
  const urls = await Promise.all(
    itemsToSearch.map(({ name, retailer }) => findProductUrl(name, retailer))
  );

  // Build lookup map: "outfitIdx-cat" → url
  const urlMap = new Map<string, string>();
  itemsToSearch.forEach(({ outfitIdx, cat }, i) => {
    urlMap.set(`${outfitIdx}-${cat}`, urls[i]);
  });

  function sanitizeItem(item: RawItem, cat: string, outfitIdx: number) {
    const retailer = String(item.retailer ?? "Fashion Retailer");
    return {
      id:          `${cat}-${Math.random().toString(36).slice(2, 7)}`,
      name:        String(item.name ?? `${cat} item`),
      category:    cat,
      retailer,
      price:       typeof item.price === "number" ? item.price : 30,
      imageUrl:    "",
      url:         urlMap.get(`${outfitIdx}-${cat}`) ?? "",
      color:       String(item.color ?? "neutral"),
      colorFamily: COLOR_FAMILIES.has(String(item.colorFamily)) ? String(item.colorFamily) : "neutral",
      styleTags:   Array.isArray(item.styleTags) ? item.styleTags.map(String) : ["casual"],
      fit:         FITS.has(String(item.fit)) ? String(item.fit) : "regular",
      seasonTags:  (Array.isArray(item.seasonTags) ? item.seasonTags.map(String) : ["all"]).filter((s) => SEASONS.has(s)),
      gender:      GENDERS.has(String(item.gender)) ? String(item.gender) : "unisex",
    };
  }

  const outfits: Outfit[] = validRaw.map((o, i) => {
    const items: Outfit["items"] = {
      top:    sanitizeItem(o.items!.top!, "top", i) as Outfit["items"]["top"],
      bottom: sanitizeItem(o.items!.bottom!, "bottom", i) as Outfit["items"]["bottom"],
      shoes:  sanitizeItem(o.items!.shoes!, "shoes", i) as Outfit["items"]["shoes"],
      ...(o.items?.outerwear && {
        outerwear: sanitizeItem(o.items.outerwear, "outerwear", i) as Outfit["items"]["outerwear"],
      }),
      ...(o.items?.accessory && {
        accessory: sanitizeItem(o.items.accessory, "accessory", i) as Outfit["items"]["accessory"],
      }),
    };

    const allItems = Object.values(items).filter(Boolean) as NonNullable<Outfit["items"]["top"]>[];
    return {
      outfitId:  `outfit-${Date.now()}-${i}`,
      title:     String(o.title ?? `Look #${i + 1}`),
      reasoning: String(o.reasoning ?? "A curated outfit for your style."),
      trending:  Boolean(o.trending),
      totalPrice: Math.round(allItems.reduce((s, p) => s + p.price, 0) * 100) / 100,
      retailers:  Array.from(new Set(allItems.map((p) => p.retailer))),
      items,
    } as Outfit;
  });

  return outfits;
}

// ─── Route handlers ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = GenerateRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { prompt, filters } = parsed.data;

    if (process.env.GOOGLE_AI_API_KEY) {
      try {
        const outfits = await generateWithGemini(prompt, filters);
        return NextResponse.json({ outfits, prompt, filters, generatedAt: new Date().toISOString(), source: "gemini" });
      } catch (err) {
        console.error("[/api/generate] Gemini failed, falling back to local:", err);
      }
    }

    // Fallback: local mock generator
    await new Promise((r) => setTimeout(r, 900 + Math.random() * 600));
    const outfits = generateOutfits({ prompt, filters, count: 5 });

    if (outfits.length === 0) {
      return NextResponse.json(
        { error: "No outfits found. Try expanding your budget or removing filters." },
        { status: 422 }
      );
    }

    return NextResponse.json({ outfits, prompt, filters, generatedAt: new Date().toISOString(), source: "local" });
  } catch (err) {
    console.error("[/api/generate] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Swap alternatives endpoint
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    const SwapSchema = z.object({
      currentItem: z.object({ id: z.string() }).passthrough(),
      outfit:      z.object({ outfitId: z.string() }).passthrough(),
      filters:     z.object({
        budgetMin:    z.number(),
        budgetMax:    z.number(),
        retailers:    z.array(z.string()),
        mixRetailers: z.boolean(),
      }),
    });

    const parsed = SwapSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid swap request" }, { status: 400 });
    }

    const { getSwapAlternatives } = await import("@/lib/generator");
    const alternatives = getSwapAlternatives(
      parsed.data.currentItem as import("@/types").Product,
      parsed.data.outfit as import("@/types").Outfit,
      parsed.data.filters as import("@/types").Filters
    );

    return NextResponse.json({ alternatives });
  } catch (err) {
    console.error("[/api/generate PUT] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
