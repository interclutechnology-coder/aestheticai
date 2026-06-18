"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Bookmark, BookmarkCheck, Loader2, User } from "lucide-react";
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
  showSwap?: boolean;
}

export function OutfitCard({ outfit, index = 0, onSaveChange }: OutfitCardProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [saved, setSaved] = useState(() => isOutfitSaved(outfit.outfitId));
  const [tryOnUrl, setTryOnUrl] = useState<string | null>(null);
  const [tryOnLoading, setTryOnLoading] = useState(false);

  const { userPhotoUrl } = useOutfitStore();

  // Get the primary garment image for try-on (top item)
  const primaryGarment = outfit.items.top ?? outfit.items.bottom ?? outfit.items.shoes;

  useEffect(() => {
    if (!userPhotoUrl || !primaryGarment?.imageUrl) return;
    if (tryOnUrl || tryOnLoading) return;

    // Check if image URL looks real (not a placeholder color)
    if (!primaryGarment.imageUrl.startsWith("http")) return;

    const generate = async () => {
      setTryOnLoading(true);
      try {
        const res = await fetch("/api/tryon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userPhotoUrl,
            garmentImageUrl: primaryGarment.imageUrl,
            category: primaryGarment.category,
          }),
        });
        const data = await res.json();
        if (data.imageUrl) setTryOnUrl(data.imageUrl);
      } catch {
        // Silently fail — fall back to product collage
      } finally {
        setTryOnLoading(false);
      }
    };

    generate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPhotoUrl, primaryGarment?.imageUrl]);

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

        {/* Try-on badge — shows when user photo is active */}
        {userPhotoUrl && (
          <div className="absolute left-3 bottom-14 z-10 flex items-center gap-1 rounded-full bg-mystyle-accent/90 px-2 py-0.5 text-[9px] font-bold text-white shadow backdrop-blur-sm">
            <User className="h-2.5 w-2.5" />
            {tryOnLoading ? "Styling…" : tryOnUrl ? "You in this" : "Try-on ready"}
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

        {/* Square image area */}
        <div className="aspect-square w-full overflow-hidden bg-mystyle-stone/20 relative">
          {tryOnLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-mystyle-dark/30 backdrop-blur-sm">
              <Loader2 className="h-6 w-6 animate-spin text-white mb-1" />
              <p className="text-[10px] text-white font-medium">Styling you…</p>
            </div>
          )}

          {tryOnUrl ? (
            // Show try-on result (user wearing the outfit)
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tryOnUrl}
              alt={`You wearing ${outfit.title}`}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            // Fall back to product collage
            <ProductCollage items={outfit.items} size="lg" className="h-full w-full rounded-none" />
          )}
        </div>

        {/* Bottom strip — name + retailers, NO price */}
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
      />
    </>
  );
}
