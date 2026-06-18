import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

export const maxDuration = 60;

const replicate = new Replicate({ auth: process.env.REPLICATE_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { userPhotoUrl, garmentImageUrl, garmentDescription } = await req.json();

    if (!userPhotoUrl || !garmentImageUrl) {
      return NextResponse.json({ error: "Missing photo or garment image" }, { status: 400 });
    }

    // IDM-VTON: virtual try-on — expects a clean single-garment photo
    const output = await replicate.run(
      "cuuupid/idm-vton:906425dbca90663ff5427624839572cc56ea7d380343d13e2a4c4b09d3f0c30f",
      {
        input: {
          human_img: userPhotoUrl,
          garm_img: garmentImageUrl,
          garment_des: garmentDescription || "upper body clothing item",
          is_checked: true,
          is_checked_crop: false,
          denoise_steps: 30,
          seed: 42,
        },
      }
    );

    const imageUrl = Array.isArray(output) ? output[0] : output;

    return NextResponse.json({ imageUrl });
  } catch (err) {
    console.error("Try-on error:", err);
    return NextResponse.json({ error: "Try-on generation failed" }, { status: 500 });
  }
}
