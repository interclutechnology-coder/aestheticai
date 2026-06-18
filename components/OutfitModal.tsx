"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Heart, ExternalLink, MapPin, RefreshCw, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import type { Outfit, Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { getRetailerSearchUrl } from "@/lib/retailerLinks";
import { saveItem, removeItem, isItemSaved } from "@/lib/storage";
import { InventoryBadge } from "./InventoryBadge";
import { ProductImage } from "./ProductImage";
import { SwapMenu } from "./SwapMenu";
import { StoreLocator } from "./StoreLocator";

interface OutfitModalProps {
  outfit: Outfit;
  open: boolean;
  onClose: () => void;
  onSaveChange?: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  top: "Top",
  bottom: "Bottom",
  shoes: "Shoes",
  outerwear: "Outerwear",
  accessory: "Accessory",
};

// Individual item row with price-reveal, save, swap, and view
function ItemRow({
  category,
  product,
  outfit,
}: {
  category: string;
  product: NonNullable<Outfit["items"][keyof Outfit["items"]]>;
  outfit: Outfit;
}) {
  const [saved, setSaved] = useState(() => isItemSaved(product.id));
  const [priceShown, setPriceShown] = useState(false);

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (saved) {
      removeItem(product.id);
      setSaved(false);
      toast.success("Item removed");
    } else {
      saveItem(product as Product);
      setSaved(true);
      toast.success(`${product.name} saved!`, { description: "Find it in Saved → Items." });
    }
  };

  return (
    <div className="flex gap-3 px-4 py-3.5 hover:bg-mystyle-cream/30 transition-colors">
      {/* Product image */}
      <div className="flex-shrink-0">
        <ProductImage product={product} className="h-20 w-16 rounded-xl" showLabel={false} />
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col justify-between min-w-0">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-mystyle-muted">
            {CATEGORY_LABELS[category] || category}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-mystyle-dark leading-tight line-clamp-2">
            {product.name}
          </p>
          <p className="text-xs text-mystyle-muted">{product.retailer}</p>
        </div>

        <div className="mt-2">
          <InventoryBadge productId={product.id} category={product.category} />
        </div>

        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {/* Price reveal */}
          <button
            type="button"
            onClick={() => setPriceShown((v) => !v)}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              priceShown
                ? "bg-mystyle-dark text-white"
                : "border border-mystyle-stone bg-mystyle-cream/60 text-mystyle-charcoal hover:bg-mystyle-stone/40"
            }`}
          >
            {priceShown ? formatPrice(product.price) : (
              <>
                See price <ChevronDown className="h-3 w-3" />
              </>
            )}
          </button>

          {/* Save individual item */}
          <button
            type="button"
            onClick={handleSave}
            title={saved ? "Remove from saved" : "Save this item"}
            className={`flex h-7 w-7 items-center justify-center rounded-full border transition-all hover:scale-110 ${
              saved
                ? "border-mystyle-accent bg-mystyle-accent/10"
                : "border-mystyle-stone bg-white hover:border-mystyle-muted"
            }`}
          >
            <Heart
              className={`h-3.5 w-3.5 ${
                saved ? "fill-mystyle-accent text-mystyle-accent" : "text-mystyle-muted"
              }`}
            />
          </button>

          {/* View at retailer */}
          <a
            href={getRetailerSearchUrl(product.retailer, product.name)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 rounded-lg bg-mystyle-dark px-2.5 py-1 text-[11px] font-semibold text-white transition-all hover:bg-mystyle-charcoal"
          >
            View <ExternalLink className="h-3 w-3" />
          </a>

          {/* Swap item */}
          <SwapMenu outfit={outfit} category={category as "top" | "bottom" | "shoes" | "outerwear" | "accessory"} />
        </div>
      </div>
    </div>
  );
}

// Fashion flat-lay: items stacked vertically like a dressed outfit
function FlatLayView({ outfit }: { outfit: Outfit }) {
  const mainCategories = ["top", "bottom", "shoes"] as const;
  const extraCategories = ["outerwear", "accessory"] as const;

  return (
    <div className="bg-mystyle-cream/50 px-5 py-4">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-mystyle-muted">
        Complete Look
      </p>
      <div className="flex gap-3">
        {/* Main column: top → bottom → shoes stacked like a dressed figure */}
        <div className="flex flex-1 flex-col gap-1.5">
          {mainCategories.map((cat) => {
            const product = outfit.items[cat];
            if (!product) return null;
            return (
              <div
                key={cat}
                className="flex items-center gap-2.5 rounded-xl bg-white p-2 shadow-sm"
              >
                <ProductImage
                  product={product}
                  className="h-14 w-11 flex-shrink-0 rounded-lg"
                  showLabel={false}
                />
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-mystyle-muted">
                    {CATEGORY_LABELS[cat]}
                  </p>
                  <p className="text-xs font-semibold text-mystyle-dark line-clamp-2 leading-tight">
                    {product.name}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Extras column: outerwear + accessory */}
        {(outfit.items.outerwear || outfit.items.accessory) && (
          <div className="flex w-[120px] flex-shrink-0 flex-col gap-1.5">
            {extraCategories.map((cat) => {
              const product = outfit.items[cat];
              if (!product) return null;
              return (
                <div key={cat} className="rounded-xl bg-white p-2 shadow-sm">
                  <ProductImage
                    product={product}
                    className="h-[72px] w-full rounded-lg"
                    showLabel={false}
                  />
                  <p className="mt-1 text-center text-[9px] font-medium text-mystyle-muted">
                    {CATEGORY_LABELS[cat]}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="mt-2.5 text-[10px] italic text-mystyle-muted/60">
        ✦ AI-styled look — product images are representative; final appearance may vary
      </p>
    </div>
  );
}

export function OutfitModal({ outfit, open, onClose, onSaveChange }: OutfitModalProps) {
  const [storeLocatorOpen, setStoreLocatorOpen] = useState(false);

  const itemEntries = (
    Object.entries(outfit.items).filter(([, v]) => v != null)
  ) as [string, NonNullable<(typeof outfit.items)[keyof typeof outfit.items]>][];

  return (
    <>
      <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-fade-in" />
          <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white shadow-2xl overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-mystyle-stone/60 bg-white p-5">
              <div className="min-w-0 pr-3">
                <Dialog.Title className="text-base font-semibold text-mystyle-dark leading-tight">
                  {outfit.title}
                </Dialog.Title>
                <p className="mt-0.5 text-xs text-mystyle-muted line-clamp-2">
                  {outfit.reasoning}
                </p>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="ml-2 flex-shrink-0 rounded-lg p-1.5 text-mystyle-muted hover:bg-mystyle-stone/60 hover:text-mystyle-dark transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>

            {/* Fashion flat-lay (model-inspired view) */}
            <FlatLayView outfit={outfit} />

            {/* Items header */}
            <div className="px-5 pt-4 pb-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-mystyle-muted">
                Individual Pieces — tap <span className="text-mystyle-accent">"See price"</span> to reveal
              </p>
            </div>

            {/* Items list */}
            <div className="flex-1 divide-y divide-mystyle-stone/30">
              {itemEntries.map(([cat, product]) => (
                <ItemRow
                  key={cat}
                  category={cat}
                  product={product}
                  outfit={outfit}
                />
              ))}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 border-t border-mystyle-stone/60 bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-mystyle-muted">Total outfit</span>
                <span className="text-xl font-bold text-mystyle-dark">
                  {formatPrice(outfit.totalPrice)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setStoreLocatorOpen(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-mystyle-stone bg-mystyle-cream py-2.5 text-sm font-medium text-mystyle-dark hover:bg-mystyle-stone/40 transition-all"
              >
                <MapPin className="h-4 w-4 text-mystyle-accent" />
                Find stores near me
              </button>

              <p className="text-center text-[10px] text-mystyle-muted/50">
                ✦ AI-generated outfit suggestions — items sourced from real retailers but exact stock may vary. Not affiliated with or endorsed by these brands.
              </p>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <StoreLocator
        open={storeLocatorOpen}
        onClose={() => setStoreLocatorOpen(false)}
        retailers={outfit.retailers}
      />
    </>
  );
}
