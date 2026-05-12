import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { GenerateRequestSchema } from "@/types";
import { generateOutfits } from "@/lib/generator";

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

    // Simulate "AI" latency — feels more real in demo
    await new Promise((resolve) => setTimeout(resolve, 900 + Math.random() * 600));

    const outfits = generateOutfits({ prompt, filters, count: 8 });

    if (outfits.length === 0) {
      return NextResponse.json(
        {
          error:
            "No outfits found matching your criteria. Try expanding your budget or removing retailer filters.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      outfits,
      prompt,
      filters,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[/api/generate] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Swap alternatives endpoint
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
