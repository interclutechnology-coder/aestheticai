import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

export const maxDuration = 60;

const replicate = new Replicate({ auth: process.env.REPLICATE_API_KEY });

// Replicate SDK returns FileOutput objects (extends ReadableStream) — not plain strings.
// FileOutput.url() returns a URL object whose .href is the actual string we need.
function getUrl(output: unknown): string | null {
  if (!output) return null;
  const item = Array.isArray(output) ? output[0] : output;
  if (!item) return null;

  // Plain string (older SDK versions)
  if (typeof item === "string") return item.startsWith("http") ? item : null;

  // FileOutput from replicate >=0.25 — has .url() returning a URL object
  if (typeof item === "object" && item !== null) {
    const obj = item as Record<string, unknown>;
    if (typeof obj.url === "function") {
      try {
        const urlResult = (obj.url as () => unknown)();
        // URL object → need .href
        if (urlResult && typeof urlResult === "object" && "href" in urlResult) {
          return String((urlResult as { href: string }).href);
        }
        const s = String(urlResult);
        return s.startsWith("http") ? s : null;
      } catch { /* fall through */ }
    }
    // Some versions expose .href directly
    if (typeof obj.href === "string") return obj.href;
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { outfitId, items, title, reasoning } = await req.json();

    if (!process.env.REPLICATE_API_KEY) {
      return NextResponse.json({ imageUrl: null, garmentImageUrl: null }, { status: 500 });
    }

    const top      = items?.top;
    const bottom   = items?.bottom;
    const shoes    = items?.shoes;
    const outerwear = items?.outerwear;
    const accessory = items?.accessory;

    if (!top || !bottom || !shoes) {
      return NextResponse.json({ imageUrl: null, garmentImageUrl: null }, { status: 400 });
    }

    const genderWord =
      top.gender === "male" ? "male" : top.gender === "female" ? "female" : "fashion";

    const outfitDesc = [
      `${top.name}${top.color ? ` in ${top.color}` : ""}`,
      `${bottom.name}${bottom.color ? ` in ${bottom.color}` : ""}`,
      shoes.name,
      outerwear?.name ?? null,
      accessory?.name ?? null,
    ]
      .filter(Boolean)
      .join(", ");

    // Image 1: full-body model wearing the complete outfit
    const outfitPrompt =
      `Professional high-fashion editorial photograph. ` +
      `Stylish ${genderWord} model wearing ${outfitDesc}. ` +
      `${title} aesthetic. ${reasoning ? reasoning + ". " : ""}` +
      `Full body shot from head to toe, clean white studio background, ` +
      `sharp focus, Vogue magazine quality, photorealistic, 4k.`;

    // Image 2: clean product shot of just the top (for IDM-VTON virtual try-on)
    const garmentPrompt =
      `Commercial fashion product photo. ` +
      `${top.name}${top.color ? ` in ${top.color}` : ""}, ` +
      `single garment displayed flat on pure white background, ` +
      `front view, no person, no mannequin.`;

    console.log(`[generate-outfit-image] Starting for "${title}" (${outfitId})`);

    const [outfitRaw, garmentRaw] = await Promise.all([
      replicate.run("black-forest-labs/flux-schnell", {
        input: {
          prompt: outfitPrompt,
          aspect_ratio: "2:3",
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

    const imageUrl     = getUrl(outfitRaw);
    const garmentImageUrl = getUrl(garmentRaw);

    console.log(
      `[generate-outfit-image] Done "${title}": outfit=${imageUrl?.slice(0, 60) ?? "null"}`
    );

    return NextResponse.json({ imageUrl, garmentImageUrl });
  } catch (err) {
    console.error("[generate-outfit-image] Error:", err);
    return NextResponse.json({ imageUrl: null, garmentImageUrl: null });
  }
}
