import { NextRequest, NextResponse } from "next/server";

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
  images?: string[];
}

interface TavilyResponse {
  results: TavilyResult[];
  images?: string[];
}

export async function POST(req: NextRequest) {
  try {
    const { query, category, budget } = await req.json();

    const searchQuery = `${query} ${category} clothing under $${budget} site:zara.com OR site:hm.com OR site:uniqlo.com OR site:nike.com OR site:asos.com`;

    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: searchQuery,
        search_depth: "basic",
        include_images: true,
        include_answer: false,
        max_results: 5,
      }),
    });

    if (!res.ok) {
      throw new Error(`Tavily error: ${res.status}`);
    }

    const data: TavilyResponse = await res.json();

    // Extract product info from results
    const products = data.results.map((r) => {
      // Try to extract price from content
      const priceMatch = r.content.match(/\$[\d,]+(?:\.\d{2})?/);
      const price = priceMatch ? parseFloat(priceMatch[0].replace(/[$,]/g, "")) : null;

      // Detect retailer from URL
      const retailer = detectRetailer(r.url);

      // Use first image found
      const imageUrl = data.images?.[0] ?? null;

      return {
        name: r.title,
        url: r.url,
        price,
        retailer,
        imageUrl,
        description: r.content.slice(0, 200),
      };
    }).filter((p) => p.price === null || p.price <= budget);

    return NextResponse.json({ products });
  } catch (err) {
    console.error("Product search error:", err);
    return NextResponse.json({ error: "Product search failed", products: [] }, { status: 500 });
  }
}

function detectRetailer(url: string): string {
  if (url.includes("zara.com")) return "Zara";
  if (url.includes("hm.com") || url.includes("h&m.com")) return "H&M";
  if (url.includes("uniqlo.com")) return "Uniqlo";
  if (url.includes("nike.com")) return "Nike";
  if (url.includes("asos.com")) return "ASOS";
  if (url.includes("abercrombie.com")) return "Abercrombie";
  if (url.includes("levi.com")) return "Levi's";
  if (url.includes("bananarepublic.com")) return "Banana Republic";
  if (url.includes("freepeople.com")) return "Free People";
  return "Online Retailer";
}
