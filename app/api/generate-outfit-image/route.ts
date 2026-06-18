import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

// Extend Vercel function timeout — FLUX Schnell takes 3–8s per image
export const maxDuration = 60;

const replicate = new Replicate({ auth: process.env.REPLICATE_API_KEY });

function extractUrl(output: unknown): string | null {
  const arr = Array.isArray(output) ? output : [output];
  const val = arr[0];
  if (!val) return null;
  // Replicate FileOutput objects expose .url() method
  if (typeof val === "object" && val !== null && "url" in val) {
    const fn = (val as { url: unknown }).url;
    return typeof fn === "function" ? String((fn as () => unknown)()) : String(val);
  }
  const str = String(val);
  return str.startsWith("http") ? str : null;
}

export async function POST(req: NextRequest) {
  try {
    const { outfitId, items, title, reasoning } = await req.json();

    if (!process.env.REPLICATE_API_KEY) {
      console.error("[generate-outfit-image] REPLICATE_API_KEY not set");
      return NextResponse.json({ imageUrl: null, garmentImageUrl: null }, { status: 500 });
    }

    const top = items?.top;
    const bottom = items?.bottom;
    const shoes = items?.shoes;
    const outerwear = items?.outerwear;
    const accessory = items?.accessory;

    if (!top || !bottom || !shoes) {
      return NextResponse.json({ imageUrl: null, garmentImageUrl: null }, { status: 400 });
    }

    // Determine model gender
    const modelType =
      top.gender === "male"
        ? "male fashion model"
        : top.gender === "female"
        ? "female fashion model"
        : "fashion model";

    // Full outfit description
    const outfitDesc = [
      `${top.name}${top.color ? ` in ${top.color}` : ""}`,
      `${bottom.name}${bottom.color ? ` in ${bottom.color}` : ""}`,
      shoes.name,
      outerwear?.name ?? null,
      accessory?.name ?? null,
    ]
      .filter(Boolean)
      .join(", ");

    // Prompt 1: Fashion model wearing the complete outfit
    const modelPrompt =
      `Professional fashion editorial photograph. Stylish ${modelType} wearing ${outfitDesc}. ` +
      `${title} aesthetic. ${reasoning ? reasoning + ". " : ""}` +
      `Full body shot, clean white studio background, sharp focus, ` +
      `Vogue magazine quality, photorealistic, 4k fashion photography.`;

    // Prompt 2: Clean product shot of the top item only (for IDM-VTON virtual try-on)
    const garmentPrompt =
      `Commercial product photograph. ` +
      `${top.name}${top.color ? ` in ${top.color}` : ""} clothing item, ` +
      `displayed flat on a pure white background, front view, ` +
      `single garment only, no person, no mannequin, clean studio product photo.`;

    console.log(`[generate-outfit-image] Generating for outfit "${title}" (${outfitId})`);

    // Run both in parallel — flux-schnell takes ~3–5s each
    const [outfitOutput, garmentOutput] = await Promise.all([
      replicate.run("black-forest-labs/flux-schnell", {
        input: {
          prompt: modelPrompt,
          aspect_ratio: "2:3",   // portrait — shows full body
          output_format: "webp",
          output_quality: 90,
          num_outputs: 1,
        },
      }),
      replicate.run("black-forest-labs/flux-schnell", {
        input: {
          prompt: garmentPrompt,
          aspect_ratio: "1:1",
          output_format: "webp",
          output_quality: 85,
          num_outputs: 1,
        },
      }),
    ]);

    const imageUrl = extractUrl(outfitOutput);
    const garmentImageUrl = extractUrl(garmentOutput);

    console.log(
      `[generate-outfit-image] Done — outfit=${imageUrl ? "✓" : "✗"} garment=${garmentImageUrl ? "✓" : "✗"}`
    );

    return NextResponse.json({ imageUrl, garmentImageUrl });
  } catch (err) {
    console.error("[generate-outfit-image] Error:", err);
    return NextResponse.json({ imageUrl: null, garmentImageUrl: null });
  }
}
