import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const { outfitId, items, title, reasoning } = await req.json();
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) return NextResponse.json({ imageUrl: null }, { status: 500 });

    const top = items?.top;
    const bottom = items?.bottom;
    const shoes = items?.shoes;
    const outerwear = items?.outerwear;
    const accessory = items?.accessory;

    if (!top || !bottom || !shoes) {
      return NextResponse.json({ imageUrl: null }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Gemini 2.0 Flash with image output
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const itemList = [
      `Top: ${top.name} (${top.color}, ${top.retailer})`,
      `Bottom: ${bottom.name} (${bottom.color}, ${bottom.retailer})`,
      `Shoes: ${shoes.name} (${shoes.retailer})`,
      outerwear ? `Outerwear: ${outerwear.name}` : null,
      accessory ? `Accessory: ${accessory.name}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const prompt = `Create a professional fashion flat-lay photograph for a styled outfit called "${title}".

Clothing items to show:
${itemList}

Style vibe: ${reasoning}

Instructions:
- Arrange all items on a clean white or light marble surface
- Fashion editorial flat-lay composition (items laid flat, arranged artfully)
- Soft natural lighting from above
- High quality product photography
- No people, no mannequins — just the clothing items
- Ensure all items are clearly visible
- Style should match the mood: ${title}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      // @ts-expect-error responseModalities not yet in SDK types
      generationConfig: { responseModalities: ["IMAGE"] },
    });

    const candidate = result.response.candidates?.[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imagePart = candidate?.content?.parts?.find((p: any) => p.inlineData);

    if (!imagePart?.inlineData?.data) {
      console.error("[generate-outfit-image] No image data in Gemini response");
      return NextResponse.json({ imageUrl: null });
    }

    // Upload to Supabase Storage
    const imageBuffer = Buffer.from(imagePart.inlineData.data, "base64");
    const supabase = createServerSupabase();
    const path = `outfits/${outfitId}-${Date.now()}.png`;

    const { error: uploadError } = await supabase.storage
      .from("tryon-results")
      .upload(path, imageBuffer, { contentType: "image/png", upsert: true });

    if (uploadError) {
      console.error("[generate-outfit-image] Supabase upload error:", uploadError.message);
      return NextResponse.json({ imageUrl: null });
    }

    const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/tryon-results/${path}`;
    return NextResponse.json({ imageUrl });
  } catch (err) {
    console.error("[generate-outfit-image] Error:", err);
    return NextResponse.json({ imageUrl: null });
  }
}
