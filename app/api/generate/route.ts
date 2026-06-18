import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { GenerateRequestSchema } from "@/types";
import type { Outfit, Filters } from "@/types";
import { generateOutfits } from "@/lib/generator";

// ─── Tavily product search ────────────────────────────────────────────────────

interface RawProduct {
  name: string;
  url: string;
  price: number;
  retailer: string;
  imageUrl: string;
  category: string;
}

const CATEGORY_QUERIES: Record<string, string> = {
  top: "women's top shirt blouse",
  bottom: "women's pants jeans skirt",
  shoes: "women's shoes sneakers boots",
  outerwear: "women's jacket coat blazer",
  accessory: "women's bag purse sunglasses jewelry",
};

const FASHION_RETAILERS = [
  "zara.com", "hm.com", "uniqlo.com", "nike.com", "asos.com",
  "nordstrom.com", "anthropologie.com", "mango.com",
];

function detectRetailer(url: string): string {
  if (url.includes("zara.com")) return "Zara";
  if (url.includes("hm.com")) return "H&M";
  if (url.includes("uniqlo.com")) return "Uniqlo";
  if (url.includes("nike.com")) return "Nike";
  if (url.includes("asos.com")) return "ASOS";
  if (url.includes("nordstrom.com")) return "Nordstrom";
  if (url.includes("anthropologie.com")) return "Anthropologie";
  if (url.includes("mango.com")) return "Mango";
  return "Fashion Retailer";
}

async function searchCategory(
  styleQuery: string,
  category: string,
  budgetMax: number
): Promise<RawProduct[]> {
  const catQuery = CATEGORY_QUERIES[category] || category;
  const query = `${styleQuery} ${catQuery} under $${budgetMax}`;

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      search_depth: "basic",
      include_images: true,
      include_answer: false,
      max_results: 6,
      include_domains: FASHION_RETAILERS,
    }),
  });

  if (!res.ok) return [];
  const data = await res.json();

  return (data.results ?? []).map((r: { title?: string; url?: string; content?: string }, i: number) => {
    const priceMatch = (r.content ?? "").match(/\$[\d,]+(?:\.\d{2})?/);
    const rawPrice = priceMatch ? parseFloat(priceMatch[0].replace(/[$,]/g, "")) : null;
    const price = rawPrice && rawPrice > 5 && rawPrice <= budgetMax ? rawPrice : Math.floor(budgetMax * 0.25 + Math.random() * budgetMax * 0.3);
    const imageUrl = (data.images ?? [])[i] ?? (data.images ?? [])[0] ?? "";

    return {
      name: r.title ?? `${category} item`,
      url: r.url ?? "",
      price: Math.round(price * 100) / 100,
      retailer: detectRetailer(r.url ?? ""),
      imageUrl,
      category,
    } as RawProduct;
  });
}

// ─── Gemini outfit generation ─────────────────────────────────────────────────

async function generateWithGemini(
  prompt: string,
  filters: Filters
): Promise<Outfit[]> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_AI_API_KEY not set");

  // Parallel Tavily searches for 3 core categories
  const [tops, bottoms, shoes, outerwear, accessories] = await Promise.all([
    searchCategory(prompt, "top", filters.budgetMax),
    searchCategory(prompt, "bottom", filters.budgetMax),
    searchCategory(prompt, "shoes", filters.budgetMax),
    searchCategory(prompt, "outerwear", filters.budgetMax),
    searchCategory(prompt, "accessory", filters.budgetMax),
  ]);

  const hasRealProducts = tops.length > 0 || bottoms.length > 0 || shoes.length > 0;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const productContext = hasRealProducts
    ? `
REAL PRODUCTS FOUND FROM FASHION RETAILERS (use these when possible):
TOPS: ${JSON.stringify(tops.slice(0, 4), null, 0)}
BOTTOMS: ${JSON.stringify(bottoms.slice(0, 4), null, 0)}
SHOES: ${JSON.stringify(shoes.slice(0, 4), null, 0)}
OUTERWEAR: ${JSON.stringify(outerwear.slice(0, 3), null, 0)}
ACCESSORIES: ${JSON.stringify(accessories.slice(0, 3), null, 0)}
`
    : "No real product search results available — use your knowledge of real fashion items.";

  const genderNote =
    filters.gender === "male"
      ? "All items must be menswear."
      : filters.gender === "female"
      ? "All items must be womenswear."
      : "Mix genders or use unisex items as appropriate.";

  const retailerNote =
    filters.retailers.length > 0
      ? `Preferred retailers: ${filters.retailers.join(", ")}.`
      : "Any fashion retailer is fine (Zara, H&M, Uniqlo, ASOS, Nike, Nordstrom, Anthropologie, Mango, etc.).";

  const geminiPrompt = `You are an expert fashion stylist AI. Create 8 complete, stylish outfit combinations based on this request.

USER REQUEST: "${prompt}"
BUDGET: $${filters.budgetMin}–$${filters.budgetMax} total per outfit
${genderNote}
${retailerNote}

${productContext}

Return ONLY a valid JSON array of 8 outfits. No markdown, no explanation, just the JSON.

Each outfit must follow this EXACT structure:
{
  "outfitId": "outfit-1",
  "title": "Catchy outfit name (3-5 words)",
  "reasoning": "1-2 sentence style description explaining the vibe and why this works",
  "trending": false,
  "totalPrice": 145.00,
  "retailers": ["Zara", "H&M"],
  "items": {
    "top": {
      "id": "top-1",
      "name": "Product name",
      "category": "top",
      "retailer": "Zara",
      "price": 39.90,
      "imageUrl": "https://...",
      "url": "https://...",
      "color": "ivory",
      "colorFamily": "white",
      "styleTags": ["minimalist", "classic"],
      "fit": "regular",
      "seasonTags": ["all"],
      "gender": "female"
    },
    "bottom": { ...same fields, category: "bottom" },
    "shoes": { ...same fields, category: "shoes" },
    "outerwear": { ...same fields, category: "outerwear" },
    "accessory": { ...same fields, category: "accessory" }
  }
}

Rules:
- colorFamily must be one of: neutral, earth, blue, warm, cool, dark, white
- fit must be one of: slim, regular, oversized, relaxed, tailored, cropped, wide
- seasonTags must be array of: spring, summer, fall, winter, all
- gender must be one of: male, female, unisex
- outerwear and accessory are optional (omit them if they don't fit the look or budget)
- totalPrice must equal sum of all item prices and stay within budget
- Make each of the 8 outfits distinctly different from each other
- For imageUrl: use the real product URLs from the search results above when available, otherwise use "" (empty string)
- For url: use the real product page URLs from search results when available, otherwise use the retailer's homepage
- Make titles creative and on-trend (e.g. "Quiet Luxury Edit", "Off-Duty Coastal", "Sharp Monday")
- trending: set to true for 2-3 of the outfits that feel most current/viral`;

  const result = await model.generateContent(geminiPrompt);
  const text = result.response.text();

  // Extract JSON from response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("Gemini returned no JSON array");

  const raw = JSON.parse(jsonMatch[0]) as Outfit[];

  // Sanitize: ensure required fields and valid enums
  const COLOR_FAMILIES = new Set(["neutral", "earth", "blue", "warm", "cool", "dark", "white"]);
  const FITS = new Set(["slim", "regular", "oversized", "relaxed", "tailored", "cropped", "wide"]);
  const GENDERS = new Set(["male", "female", "unisex"]);
  const SEASONS = new Set(["spring", "summer", "fall", "winter", "all"]);

  function sanitizeItem(item: Record<string, unknown>, cat: string) {
    return {
      id: String(item.id || `${cat}-${Math.random().toString(36).slice(2, 7)}`),
      name: String(item.name || `${cat} item`),
      category: cat,
      retailer: String(item.retailer || "Fashion Retailer"),
      price: typeof item.price === "number" ? item.price : 30,
      imageUrl: String(item.imageUrl || ""),
      url: String(item.url || ""),
      color: String(item.color || "neutral"),
      colorFamily: COLOR_FAMILIES.has(String(item.colorFamily)) ? String(item.colorFamily) : "neutral",
      styleTags: Array.isArray(item.styleTags) ? item.styleTags.map(String) : ["casual"],
      fit: FITS.has(String(item.fit)) ? String(item.fit) : "regular",
      seasonTags: Array.isArray(item.seasonTags)
        ? item.seasonTags.map(String).filter((s) => SEASONS.has(s))
        : ["all"],
      gender: GENDERS.has(String(item.gender)) ? String(item.gender) : "unisex",
    };
  }

  const outfits: Outfit[] = raw
    .filter((o) => o?.items?.top && o?.items?.bottom && o?.items?.shoes)
    .map((o, i) => {
      const items: Outfit["items"] = {
        top: sanitizeItem(o.items.top as unknown as Record<string, unknown>, "top") as Outfit["items"]["top"],
        bottom: sanitizeItem(o.items.bottom as unknown as Record<string, unknown>, "bottom") as Outfit["items"]["bottom"],
        shoes: sanitizeItem(o.items.shoes as unknown as Record<string, unknown>, "shoes") as Outfit["items"]["shoes"],
        ...(o.items.outerwear && {
          outerwear: sanitizeItem(o.items.outerwear as unknown as Record<string, unknown>, "outerwear") as Outfit["items"]["outerwear"],
        }),
        ...(o.items.accessory && {
          accessory: sanitizeItem(o.items.accessory as unknown as Record<string, unknown>, "accessory") as Outfit["items"]["accessory"],
        }),
      };

      const allItems = Object.values(items).filter(Boolean) as Outfit["items"]["top"][];
      const totalPrice = Math.round(allItems.reduce((s, p) => s + p!.price, 0) * 100) / 100;
      const retailers = Array.from(new Set(allItems.map((p) => p!.retailer)));

      return {
        outfitId: `outfit-${Date.now()}-${i}`,
        title: String(o.title || `Look #${i + 1}`),
        reasoning: String(o.reasoning || "A curated outfit for your style."),
        trending: Boolean(o.trending),
        totalPrice,
        retailers,
        items,
      } as Outfit;
    });

  if (outfits.length < 4) throw new Error(`Only got ${outfits.length} valid outfits from Gemini`);

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

    // Try Gemini + Tavily first
    if (process.env.GOOGLE_AI_API_KEY && process.env.TAVILY_API_KEY) {
      try {
        const outfits = await generateWithGemini(prompt, filters);
        return NextResponse.json({
          outfits,
          prompt,
          filters,
          generatedAt: new Date().toISOString(),
          source: "gemini",
        });
      } catch (err) {
        console.error("[/api/generate] Gemini generation failed, falling back to local:", err);
      }
    }

    // Fallback: local mock generator
    await new Promise((resolve) => setTimeout(resolve, 900 + Math.random() * 600));
    const outfits = generateOutfits({ prompt, filters, count: 8 });

    if (outfits.length === 0) {
      return NextResponse.json(
        { error: "No outfits found. Try expanding your budget or removing filters." },
        { status: 422 }
      );
    }

    return NextResponse.json({
      outfits,
      prompt,
      filters,
      generatedAt: new Date().toISOString(),
      source: "local",
    });
  } catch (err) {
    console.error("[/api/generate] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Swap alternatives endpoint — unchanged
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    const SwapSchema = z.object({
      currentItem: z.object({ id: z.string() }).passthrough(),
      outfit: z.object({ outfitId: z.string() }).passthrough(),
      filters: z.object({
        budgetMin: z.number(),
        budgetMax: z.number(),
        retailers: z.array(z.string()),
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
