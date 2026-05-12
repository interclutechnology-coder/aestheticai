"use client";

import { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { RefreshCw, Lock, Unlock, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { ProductImage } from "./ProductImage";
import type { Outfit, Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useOutfitStore } from "@/store/outfitStore";

type OutfitCategory = "top" | "bottom" | "shoes" | "outerwear" | "accessory";

interface SwapMenuProps {
  outfit: Outfit;
  category: OutfitCategory;
}

export function SwapMenu({ outfit, category }: SwapMenuProps) {
  const [alternatives, setAlternatives] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { swapItem, toggleLock, filters } = useOutfitStore();

  const currentItem = outfit.items[category];
  if (!currentItem) return null;

  const isLocked = outfit.lockedItems?.[category] ?? false;

  const fetchAlternatives = async () => {
    if (alternatives.length > 0) return; // cached
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentItem, outfit, filters }),
      });
      const data = await res.json();
      setAlternatives(data.alternatives ?? []);
    } catch {
      toast.error("Failed to load alternatives");
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = (newItem: Product) => {
    swapItem(outfit.outfitId, category as keyof Outfit["items"], newItem);
    toast.success(`Swapped to ${newItem.name}`);
    setOpen(false);
  };

  const handleToggleLock = () => {
    toggleLock(outfit.outfitId, category);
    toast.success(isLocked ? `${category} unlocked` : `${category} locked`);
  };

  const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);

  return (
    <div className="flex items-center gap-1">
      {/* Lock button */}
      <button
        type="button"
        onClick={handleToggleLock}
        className={`rounded-lg p-1.5 transition-colors ${
          isLocked
            ? "bg-mystyle-dark text-white"
            : "text-mystyle-muted hover:bg-mystyle-stone/60 hover:text-mystyle-dark"
        }`}
        title={isLocked ? `Unlock ${categoryLabel}` : `Lock ${categoryLabel}`}
      >
        {isLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
      </button>

      {/* Swap dropdown */}
      <DropdownMenu.Root open={open} onOpenChange={(o) => { setOpen(o); if (o) fetchAlternatives(); }}>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-mystyle-stone bg-white px-2 py-1.5 text-[11px] font-medium text-mystyle-charcoal transition-all hover:bg-mystyle-stone/40"
          >
            <RefreshCw className="h-3 w-3" />
            Swap
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="z-50 w-64 rounded-xl border border-mystyle-stone bg-white shadow-xl animate-fade-in overflow-hidden max-h-80 overflow-y-auto"
            sideOffset={6}
            align="start"
          >
            <div className="px-3 py-2 border-b border-mystyle-stone/60 bg-mystyle-cream/60">
              <p className="text-[11px] font-semibold text-mystyle-muted uppercase tracking-wider">
                Swap {categoryLabel}
              </p>
            </div>

            {loading ? (
              <div className="p-4 text-center text-xs text-mystyle-muted">
                Finding alternatives…
              </div>
            ) : alternatives.length === 0 ? (
              <div className="p-4 text-center text-xs text-mystyle-muted">
                No alternatives in budget
              </div>
            ) : (
              alternatives.map((alt) => (
                <DropdownMenu.Item
                  key={alt.id}
                  className="flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-mystyle-cream/60 focus:outline-none focus:bg-mystyle-cream/60"
                  onSelect={() => handleSwap(alt)}
                >
                  <ProductImage
                    product={alt}
                    className="h-10 w-10 flex-shrink-0 rounded-lg"
                    showLabel={false}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-mystyle-dark">{alt.name}</p>
                    <p className="text-[10px] text-mystyle-muted">{alt.retailer}</p>
                  </div>
                  <span className="flex-shrink-0 text-xs font-bold text-mystyle-accent">
                    {formatPrice(alt.price)}
                  </span>
                </DropdownMenu.Item>
              ))
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}
