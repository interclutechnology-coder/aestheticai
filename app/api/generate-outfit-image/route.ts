import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({ auth: process.env.REPLICATE_API_KEY });

function replicateUrl(output: unknown): string | null {
  if (!output) return null;
  const arr = Array.isArray(output) ? output : [output];
  const val = arr[0];
  if (!val) return null;
  // Replicate FileOutput objects have a .url() method; plain strings work directly
  if (typeof val === "object" && "url" in val && typeof (val as { url: unknown }).url === "function") {
    return String((val as { url: () => unknown }).url());
  }
  const str = String(val);
  return str.startsWith("http") ? str : null;
}

export async function POST(req: NextRequest) {
  try {
    const { outfitId, items, title, reasoning } = await req.json();

    if (!process.env.REPLICATE_API_KEY) {
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

    const itemDesc = [
      `${top.name}${top.color ? ` in ${top.color}` : ""}`,
      `${bottom.name}${bottom.color ? ` in ${bottom.color}` : ""}`,
      shoes.name,
      outerwear?.name,
      accessory?.name,
    ]
      .filter(Boolean)
      .join(", ");

    // Prompt 1: Full outfit flat-lay (for card display)
    const flatLayPrompt =
      `Professional fashion photography flat lay. ${itemDesc}. ` +
      `Styled as: ${title}. ${reasoning || ""}. ` +
      `Clothing items beautifully arranged on clean white marble surface, ` +
      `soft overhead natural lighting, editorial fashion magazine quality, ` +
      `sharp focus, photorealistic, no people, no mannequins.`;

    // Prompt 2: Single garment image (for virtual try-on via IDM-VTON)
    const garmentPrompt =
      `Product photography of ${top.name}${top.color ? ` in ${top.color}` : ""}. ` +
      `Single clothing item, displayed flat on pure white background, ` +
      `front view, commercial clothing product photo, ` +
      `no person, no mannequin, clean white background only.`;

    console.log(`[generate-outfit-image] Generating images for ${outfitId}`);

    // Generate both images in parallel using FLUX Schnell
    const [flatLayOutput, garmentOutput] = await Promise.all([
      replicate.run("black-forest-labs/flux-schnell", {
        input: {
          prompt: flatLayPrompt,
          aspect_ratio: "1:1",
          output_format: "webp",
          output_quality: 85,
          num_outputs: 1,
          go_fast: true,
        },
      }),
      replicate.run("black-forest-labs/flux-schnell", {
        input: {
          prompt: garmentPrompt,
          aspect_ratio: "1:1",
          output_format: "webp",
          output_quality: 85,
          num_outputs: 1,
          go_fast: true,
        },
      }),
    ]);

    const imageUrl = replicateUrl(flatLayOutput);
    const garmentImageUrl = replicateUrl(garmentOutput);

    console.log(`[generate-outfit-image] Done — imageUrl=${!!imageUrl} garmentUrl=${!!garmentImageUrl}`);

    return NextResponse.json({ imageUrl, garmentImageUrl });
  } catch (err) {
    console.error("[generate-outfit-image] Error:", err);
    return NextResponse.json({ imageUrl: null, garmentImageUrl: null });
  }
}
