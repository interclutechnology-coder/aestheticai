"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, TrendingUp, Store, Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import type { Outfit } from "@/types";
import { formatPrice } from "@/lib/utils";
import { saveOutfit, removeOutfit, isOutfitSaved } from "@/lib/storage";
import { ProductCollage } from "./ProductCollage";
import { OutfitModal } from "./OutfitModal";
import { BuyOutfitModal } from "./BuyOutfitModal";
import { SwapMenu } from "./SwapMenu";

interface OutfitCardProps {
  outfit: Outfit;
  index?: number;
  onSaveChange?: () => void;
  showSwap?: boolean;
}

export function OutfitCard({
  outfit,
  index = 0,
  onSaveChange,
  showSwap = true,
}: OutfitCardProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);
  const [saved, setSaved] = useState(() => isOutfitSaved(outfit.outfitId));

  const handleSave = () => {
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

  const categories = (
    Object.keys(outfit.items) as Array<keyof typeof outfit.items>
  ).filter((k) => outfit.items[k] != null);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.08 }}
        className="group relative flex flex-col overflow-hidden rounded-2xl border border-mystyle-stone bg-white shadow-md hover:shadow-xl transition-all duration-300"
      >
        {/* Trending badge */}
        {outfit.trending && (
          <div className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-mystyle-dark px-2.5 py-1 text-[10px] font-bold text-white shadow">
            <TrendingUp className="h-3 w-3" />
            Trending
          </div>
        )}

        {/* Save button */}
        <button
          type="button"
          onClick={handleSave}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow backdrop-blur-sm transition-all hover:scale-110 hover:bg-white"
        >
          {saved ? (
            <BookmarkCheck className="h-4 w-4 text-mystyle-accent" />
          ) : (
            <Bookmark className="h-4 w-4 text-mystyle-muted" />
          )}
        </button>

        {/* Collage */}
        <div className="relative overflow-hidden bg-mystyle-stone/20 cursor-pointer" onClick={() => setDetailOpen(true)}>
          <ProductCollage items={outfit.items} size="md" className="rounded-none" />
        </div>

        {/* Card body */}
        <div className="flex flex-1 flex-col p-3 gap-2">
          {/* Title + retailers */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-mystyle-dark leading-tight line-clamp-1">
                {outfit.title}
              </h3>
              <div className="mt-0.5 flex items-center gap-1">
                <Store className="h-2.5 w-2.5 text-mystyle-muted flex-shrink-0" />
                <p className="text-[10px] text-mystyle-muted truncate">
                  {outfit.retailers.join(" · ")}
                </p>
              </div>
            </div>
            {/* Price inline */}
            <p className="text-lg font-bold text-mystyle-dark flex-shrink-0">
              {formatPrice(outfit.totalPrice)}
            </p>
          </div>

          {/* Reasoning */}
          <p className="text-[11px] text-mystyle-muted leading-relaxed line-clamp-1">
            {outfit.reasoning}
          </p>

          {/* Color swatches */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {outfit.items.top && (
                <div className="h-3.5 w-3.5 rounded-sm" style={{ background: colorToHex(outfit.items.top.colorFamily) }} />
              )}
              {outfit.items.bottom && (
                <div className="h-3.5 w-3.5 rounded-sm" style={{ background: colorToHex(outfit.items.bottom.colorFamily) }} />
              )}
              {outfit.items.shoes && (
                <div className="h-3.5 w-3.5 rounded-sm" style={{ background: colorToHex(outfit.items.shoes.colorFamily) }} />
              )}
            </div>
          </div>

          {/* Swap controls */}
          {showSwap && (
            <div className="border-t border-mystyle-stone/40 pt-2">
              <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-widest text-mystyle-muted">
                Swap items
              </p>
              <div className="flex flex-wrap gap-1">
                {categories.map((cat) => (
                  <SwapMenu key={cat} outfit={outfit} category={cat as "top" | "bottom" | "shoes" | "outerwear" | "accessory"} />
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-auto grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDetailOpen(true)}
              className="flex items-center justify-center gap-1 rounded-xl border border-mystyle-stone bg-mystyle-cream/60 py-2 text-xs font-semibold text-mystyle-dark transition-all hover:bg-mystyle-stone/50"
            >
              <Heart className="h-3 w-3" />
              Shop Outfit
            </button>
            <button
              type="button"
              onClick={() => setBuyOpen(true)}
              className="flex items-center justify-center gap-1 rounded-xl bg-mystyle-dark py-2 text-xs font-semibold text-white transition-all hover:bg-mystyle-charcoal"
            >
              <ShoppingBag className="h-3 w-3" />
              Buy All
            </button>
          </div>
        </div>
      </motion.div>

      <OutfitModal outfit={outfit} open={detailOpen} onClose={() => setDetailOpen(false)} />
      <BuyOutfitModal outfit={outfit} open={buyOpen} onClose={() => setBuyOpen(false)} />
    </>
  );
}

// Simple color family → hex for color swatch
function colorToHex(family: string): string {
  const map: Record<string, string> = {
    white: "#FAF8F5",
    neutral: "#B0A090",
    earth: "#C8A882",
    blue: "#4A6FA5",
    warm: "#D4B8A8",
    cool: "#7BA7BC",
    dark: "#2D2926",
  };
  return map[family] ?? "#E8E4DD";
}
