import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate it's an image
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Image must be under 10MB" }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Unique filename
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const path = `uploads/${filename}`;

    const { error } = await supabase.storage
      .from("user-photos")
      .upload(path, buffer, { contentType: file.type, upsert: false });

    if (error) {
      // If bucket doesn't exist yet, return a helpful message
      if (error.message.includes("Bucket not found") || error.message.includes("not found")) {
        return NextResponse.json(
          { error: "Storage not configured yet — create 'user-photos' bucket in Supabase dashboard" },
          { status: 503 }
        );
      }
      throw error;
    }

    const { data: urlData } = supabase.storage
      .from("user-photos")
      .getPublicUrl(path);

    return NextResponse.json({ url: urlData.publicUrl, path });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
