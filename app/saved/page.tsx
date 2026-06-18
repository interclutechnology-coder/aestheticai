"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bookmark,
  Trash2,
  ExternalLink,
  Sparkles,
  Heart,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import {
  getSavedOutfits,
  removeOutfit,
  getSavedItems,
  removeItem,
} from "@/lib/storage";
import type { Outfit } from "@/types";
import type { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { ProductCollage } from "@/components/ProductCollage";
import { ProductImage } from "@/components/ProductImage";
import { OutfitModal } from "@/components/OutfitModal";
import { getRetailerSearchUrl } from "@/lib/retailerLinks";

type Tab = "outfits" | "items";

export default function SavedPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("outfits");
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [items, setItems] = useState<Product[]>([]);
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setOutfits(getSavedOutfits());
    setItems(getSavedItems());
  }, []);

  const handleRemoveOutfit = (outfitId: string) => {
    removeOutfit(outfitId);
    setOutfits((prev) => prev.filter((o) => o.outfitId !== outfitId));
    toast.success("Outfit removed");
  };

  const handleRemoveItem = (itemId: string) => {
    removeItem(itemId);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    toast.success("Item removed");
  };

  if (!mounted) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-mystyle-dark">Saved</h1>
          <p className="mt-1 text-sm text-mystyle-muted">
            Your favorite outfits and individual pieces
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex items-center gap-1 rounded-xl border border-mystyle-stone bg-white p-1 w-fit">
        <button
          type="button"
          onClick={() => setTab("outfits")}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            tab === "outfits"
              ? "bg-mystyle-dark text-white shadow-sm"
              : "text-mystyle-muted hover:text-mystyle-dark"
          }`}
        >
          <Bookmark className="h-3.5 w-3.5" />
          Outfits
          {outfits.length > 0 && (
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${tab === "outfits" ? "bg-white/20 text-white" : "bg-mystyle-stone/60 text-mystyle-muted"}`}>
              {outfits.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab("items")}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            tab === "items"
              ? "bg-mystyle-dark text-white shadow-sm"
              : "text-mystyle-muted hover:text-mystyle-dark"
          }`}
        >
          <Heart className="h-3.5 w-3.5" />
          Items
          {items.length > 0 && (
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${tab === "items" ? "bg-white/20 text-white" : "bg-mystyle-stone/60 text-mystyle-muted"}`}>
              {items.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Outfits tab ── */}
      <AnimatePresence mode="wait">
        {tab === "outfits" && (
          <motion.div
            key="outfits"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {outfits.length === 0 ? (
              <div className="flex flex-col items-center gap-5 py-24 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-mystyle-stone bg-white shadow-sm">
                  <Bookmark className="h-7 w-7 text-mystyle-stone" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-mystyle-dark">No saved outfits yet</p>
                  <p className="mt-1.5 max-w-xs text-sm text-mystyle-muted">
                    Generate outfits and tap the bookmark icon to save your favorites here.
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
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                  {outfits.map((outfit, i) => (
                    <motion.div
                      key={outfit.outfitId}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.25, delay: i * 0.05 }}
                      className="group overflow-hidden rounded-2xl border border-mystyle-stone bg-white shadow-sm hover:shadow-lg transition-all duration-300"
                    >
                      {/* Collage */}
                      <div
                        className="aspect-square cursor-pointer overflow-hidden bg-mystyle-stone/20"
                        onClick={() => setSelectedOutfit(outfit)}
                      >
                        <ProductCollage items={outfit.items} size="lg" className="h-full w-full rounded-none" />
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

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedOutfit(outfit)}
                            className="flex items-center justify-center gap-1 rounded-xl border border-mystyle-stone bg-mystyle-cream/60 py-2 text-xs font-medium text-mystyle-dark transition-all hover:bg-mystyle-stone/50"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View Details
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveOutfit(outfit.outfitId)}
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
          </motion.div>
        )}

        {/* ── Items tab ── */}
        {tab === "items" && (
          <motion.div
            key="items"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-5 py-24 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-mystyle-stone bg-white shadow-sm">
                  <Heart className="h-7 w-7 text-mystyle-stone" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-mystyle-dark">No saved items yet</p>
                  <p className="mt-1.5 max-w-xs text-sm text-mystyle-muted">
                    Tap the heart icon on individual pieces in any outfit to save them here.
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
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                <AnimatePresence>
                  {items.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, delay: i * 0.04 }}
                      className="overflow-hidden rounded-2xl border border-mystyle-stone bg-white shadow-sm hover:shadow-lg transition-all duration-300"
                    >
                      {/* Item image */}
                      <div className="aspect-square overflow-hidden bg-mystyle-stone/20">
                        <ProductImage
                          product={item}
                          className="h-full w-full rounded-none"
                          showLabel={false}
                        />
                      </div>

                      {/* Item info */}
                      <div className="p-3 space-y-2">
                        <div>
                          <div className="flex items-center gap-1">
                            <Tag className="h-2.5 w-2.5 text-mystyle-muted flex-shrink-0" />
                            <p className="text-[9px] font-semibold uppercase tracking-wider text-mystyle-muted">
                              {item.category}
                            </p>
                          </div>
                          <p className="mt-0.5 text-xs font-semibold text-mystyle-dark leading-tight line-clamp-2">
                            {item.name}
                          </p>
                          <p className="text-[11px] text-mystyle-muted">{item.retailer}</p>
                        </div>

                        <p className="text-sm font-bold text-mystyle-dark">
                          {formatPrice(item.price)}
                        </p>

                        <div className="grid grid-cols-2 gap-1.5">
                          <a
                            href={getRetailerSearchUrl(item.retailer, item.name)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1 rounded-lg bg-mystyle-dark py-1.5 text-[11px] font-semibold text-white transition-all hover:bg-mystyle-charcoal"
                          >
                            View <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="flex items-center justify-center gap-1 rounded-lg border border-red-200 bg-red-50 py-1.5 text-[11px] font-medium text-red-600 transition-all hover:bg-red-100"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                            Remove
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Outfit detail modal */}
      {selectedOutfit && (
        <OutfitModal
          outfit={selectedOutfit}
          open={!!selectedOutfit}
          onClose={() => setSelectedOutfit(null)}
        />
      )}
    </div>
  );
}
