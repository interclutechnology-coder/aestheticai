"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Bookmark, BookmarkCheck, Loader2, User, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { Outfit } from "@/types";
import { saveOutfit, removeOutfit, isOutfitSaved } from "@/lib/storage";
import { useOutfitStore } from "@/store/outfitStore";
import { ProductCollage } from "./ProductCollage";
import { OutfitModal } from "./OutfitModal";

interface OutfitCardProps {
  outfit: Outfit;
  index?: number;
  onSaveChange?: () => void;
}

export function OutfitCard({ outfit, index = 0, onSaveChange }: OutfitCardProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [saved, setSaved] = useState(() => isOutfitSaved(outfit.outfitId));

  // AI-generated images for this outfit
  const [outfitImageUrl, setOutfitImageUrl] = useState<string | null>(null);  // full flat-lay
  const [garmentImageUrl, setGarmentImageUrl] = useState<string | null>(null); // single top item
  const [imageLoading, setImageLoading] = useState(false);
  const imageRequestedRef = useRef(false);

  // Virtual try-on result
  const [tryOnUrl, setTryOnUrl] = useState<string | null>(null);
  const [tryOnLoading, setTryOnLoading] = useState(false);

  const { userPhotoUrl } = useOutfitStore();

  // Step 1: Generate AI images for this outfit (flat-lay + garment)
  useEffect(() => {
    if (imageRequestedRef.current) return;
    imageRequestedRef.current = true;
    setImageLoading(true);

    fetch("/api/generate-outfit-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        outfitId: outfit.outfitId,
        items: outfit.items,
        title: outfit.title,
        reasoning: outfit.reasoning,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.imageUrl) setOutfitImageUrl(data.imageUrl);
        if (data.garmentImageUrl) setGarmentImageUrl(data.garmentImageUrl);
      })
      .catch(() => {})
      .finally(() => setImageLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outfit.outfitId]);

  // Step 2: Virtual try-on — uses the clean single-garment image (not full flat-lay)
  useEffect(() => {
    if (!userPhotoUrl || !garmentImageUrl) return;
    if (tryOnUrl || tryOnLoading) return;

    const generate = async () => {
      setTryOnLoading(true);
      try {
        const res = await fetch("/api/tryon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userPhotoUrl,
            garmentImageUrl,
            garmentDescription: outfit.items.top?.name ?? "upper body clothing item",
          }),
        });
        const data = await res.json();
        if (data.imageUrl) setTryOnUrl(data.imageUrl);
      } catch {
        // Silently fail
      } finally {
        setTryOnLoading(false);
      }
    };

    generate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPhotoUrl, garmentImageUrl]);

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (saved) {
      removeOutfit(outfit.outfitId);
      setSaved(false);
      toast.success("Outfit removed from saved");
    } else {
      saveOutfit(outfit);
      setSaved(true);
      toast.success("Outfit saved!", { description: "Find it in your Saved tab." });
    }
    onSaveChange?.();
  };

  // What to show in the card image area (priority order)
  const cardImageUrl = tryOnUrl ?? outfitImageUrl ?? null;
  const isGenerating = imageLoading || tryOnLoading;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: index * 0.06 }}
        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-mystyle-stone bg-white shadow-sm hover:shadow-xl transition-all duration-300"
        onClick={() => setDetailOpen(true)}
      >
        {/* Trending badge */}
        {outfit.trending && (
          <div className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-mystyle-dark/90 px-2.5 py-1 text-[10px] font-bold text-white shadow backdrop-blur-sm">
            <TrendingUp className="h-3 w-3" />
            Trending
          </div>
        )}

        {/* Status badge */}
        {userPhotoUrl && (
          <div className="absolute left-3 bottom-14 z-10 flex items-center gap-1 rounded-full bg-mystyle-accent/90 px-2 py-0.5 text-[9px] font-bold text-white shadow backdrop-blur-sm">
            <User className="h-2.5 w-2.5" />
            {tryOnLoading ? "Styling you…" : tryOnUrl ? "You in this" : "Try-on pending"}
          </div>
        )}

        {/* Save button */}
        <button
          type="button"
          onClick={handleSave}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow backdrop-blur-sm transition-all hover:scale-110 hover:bg-white"
          title={saved ? "Remove from saved" : "Save outfit"}
        >
          {saved ? (
            <BookmarkCheck className="h-4 w-4 text-mystyle-accent" />
          ) : (
            <Bookmark className="h-4 w-4 text-mystyle-muted" />
          )}
        </button>

        {/* Portrait image area — 2:3 ratio shows full-body model */}
        <div className="aspect-[2/3] w-full overflow-hidden bg-mystyle-stone/20 relative">

          {/* Loading overlay */}
          {isGenerating && !cardImageUrl && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-mystyle-cream/80 backdrop-blur-sm">
              <Loader2 className="h-6 w-6 animate-spin text-mystyle-accent mb-2" />
              <p className="text-[11px] font-medium text-mystyle-muted">
                {tryOnLoading ? "Styling you…" : "Generating look…"}
              </p>
            </div>
          )}

          {cardImageUrl ? (
            // Show AI-generated outfit image or try-on result
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cardImageUrl}
              alt={tryOnUrl ? `You wearing ${outfit.title}` : outfit.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            // Fallback: gradient collage while image generates
            <ProductCollage items={outfit.items} size="lg" className="h-full w-full rounded-none" />
          )}

          {/* "AI Look" badge when image has generated but no try-on */}
          {outfitImageUrl && !tryOnUrl && !isGenerating && (
            <div className="absolute left-3 bottom-14 z-10 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-bold text-white shadow backdrop-blur-sm">
              <Sparkles className="h-2.5 w-2.5" />
              AI Look
            </div>
          )}
        </div>

        {/* Bottom strip */}
        <div className="p-3.5">
          <h3 className="text-sm font-semibold text-mystyle-dark leading-tight line-clamp-1">
            {outfit.title}
          </h3>
          <p className="mt-0.5 text-[11px] text-mystyle-muted truncate">
            {outfit.retailers.join(" · ")}
          </p>
          <p className="mt-1.5 text-[10px] text-mystyle-muted/50 group-hover:text-mystyle-accent transition-colors">
            Tap to view pieces &amp; prices →
          </p>
        </div>
      </motion.div>

      <OutfitModal
        outfit={outfit}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onSaveChange={onSaveChange}
        tryOnUrl={tryOnUrl}
        outfitImageUrl={outfitImageUrl}
      />
    </>
  );
}
