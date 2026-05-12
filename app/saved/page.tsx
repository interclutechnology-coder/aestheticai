"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, Trash2, ExternalLink, ShoppingBag, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { getSavedOutfits, removeOutfit } from "@/lib/storage";
import type { Outfit } from "@/types";
import { formatPrice } from "@/lib/utils";
import { ProductCollage } from "@/components/ProductCollage";
import { OutfitModal } from "@/components/OutfitModal";
import { BuyOutfitModal } from "@/components/BuyOutfitModal";

export default function SavedPage() {
  const router = useRouter();
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [buyOutfit, setBuyOutfit] = useState<Outfit | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setOutfits(getSavedOutfits());
  }, []);

  const handleRemove = (outfitId: string) => {
    removeOutfit(outfitId);
    setOutfits((prev) => prev.filter((o) => o.outfitId !== outfitId));
    toast.success("Outfit removed");
  };

  if (!mounted) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-mystyle-accent" />
            <h1 className="text-2xl font-bold text-mystyle-dark">Saved Outfits</h1>
          </div>
          <p className="mt-1 text-sm text-mystyle-muted">
            {outfits.length === 0
              ? "Your favorites will appear here"
              : `${outfits.length} outfit${outfits.length !== 1 ? "s" : ""} saved`}
          </p>
        </div>
      </div>

      {/* Empty state */}
      <AnimatePresence>
        {outfits.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-5 py-24 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-mystyle-stone bg-white shadow-sm">
              <Bookmark className="h-7 w-7 text-mystyle-stone" />
            </div>
            <div>
              <p className="text-lg font-semibold text-mystyle-dark">
                No saved outfits yet
              </p>
              <p className="mt-1.5 text-sm text-mystyle-muted max-w-xs">
                Generate some outfits and save your favorites — they&apos;ll live here.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex items-center gap-2 rounded-xl bg-mystyle-dark px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-mystyle-charcoal hover:shadow-md"
            >
              <Sparkles className="h-4 w-4" />
              Generate Outfits
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      {outfits.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {outfits.map((outfit, i) => (
              <motion.div
                key={outfit.outfitId}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, delay: i * 0.06 }}
                className="group relative overflow-hidden rounded-2xl border border-mystyle-stone bg-white shadow-md hover:shadow-xl transition-all duration-300"
              >
                {/* Trending badge */}
                {outfit.trending && (
                  <div className="absolute left-3 top-3 z-10 rounded-full bg-mystyle-dark px-2.5 py-1 text-[10px] font-bold text-white">
                    Trending
                  </div>
                )}

                {/* Collage — clickable */}
                <div
                  className="relative cursor-pointer overflow-hidden bg-mystyle-stone/20"
                  onClick={() => setSelectedOutfit(outfit)}
                >
                  <ProductCollage items={outfit.items} size="md" className="rounded-none" />
                </div>

                {/* Body */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-mystyle-dark leading-tight line-clamp-1">
                      {outfit.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-mystyle-muted">
                      {outfit.retailers.join(" · ")}
                    </p>
                  </div>

                  <p className="text-xs text-mystyle-muted leading-relaxed line-clamp-2">
                    {outfit.reasoning}
                  </p>

                  <div className="flex items-center justify-between">
                    <p className="text-xl font-bold text-mystyle-dark">
                      {formatPrice(outfit.totalPrice)}
                    </p>
                    {outfit.savedAt && (
                      <p className="text-[10px] text-mystyle-muted/70">
                        {new Date(outfit.savedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedOutfit(outfit)}
                      className="flex items-center justify-center gap-1 rounded-xl border border-mystyle-stone bg-mystyle-cream/60 py-2 text-xs font-medium text-mystyle-dark transition-all hover:bg-mystyle-stone/50"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => setBuyOutfit(outfit)}
                      className="flex items-center justify-center gap-1 rounded-xl bg-mystyle-dark py-2 text-xs font-semibold text-white transition-all hover:bg-mystyle-charcoal"
                    >
                      <ShoppingBag className="h-3 w-3" />
                      Buy
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(outfit.outfitId)}
                      className="flex items-center justify-center gap-1 rounded-xl border border-red-200 bg-red-50 py-2 text-xs font-medium text-red-600 transition-all hover:bg-red-100"
                    >
                      <Trash2 className="h-3 w-3" />
                      Remove
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modals */}
      {selectedOutfit && (
        <OutfitModal
          outfit={selectedOutfit}
          open={!!selectedOutfit}
          onClose={() => setSelectedOutfit(null)}
        />
      )}
      {buyOutfit && (
        <BuyOutfitModal
          outfit={buyOutfit}
          open={!!buyOutfit}
          onClose={() => setBuyOutfit(null)}
        />
      )}
    </div>
  );
}
