"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import type { Outfit } from "@/types";
import { saveOutfit, removeOutfit, isOutfitSaved } from "@/lib/storage";
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

        {/* Save outfit button */}
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

        {/* Square collage — Pinterest style */}
        <div className="aspect-square w-full overflow-hidden bg-mystyle-stone/20">
          <ProductCollage items={outfit.items} size="lg" className="h-full w-full rounded-none" />
        </div>

        {/* Bottom strip — name + retailer only, NO price */}
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
      />
    </>
  );
}
