"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X, ExternalLink } from "lucide-react";
import type { Outfit } from "@/types";
import { formatPrice } from "@/lib/utils";
import { getRetailerSearchUrl } from "@/lib/retailerLinks";
import { InventoryBadge } from "./InventoryBadge";
import { ProductImage } from "./ProductImage";

interface OutfitModalProps {
  outfit: Outfit;
  open: boolean;
  onClose: () => void;
}

export function OutfitModal({ outfit, open, onClose }: OutfitModalProps) {
  const itemEntries = Object.entries(outfit.items).filter(([, v]) => v != null) as [
    string,
    NonNullable<(typeof outfit.items)[keyof typeof outfit.items]>
  ][];

  const categoryLabels: Record<string, string> = {
    top: "Top",
    bottom: "Bottom",
    shoes: "Shoes",
    outerwear: "Outerwear",
    accessory: "Accessory",
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl data-[state=open]:animate-slide-up overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-start justify-between border-b border-mystyle-stone/60 bg-white p-5">
            <div>
              <Dialog.Title className="text-base font-semibold text-mystyle-dark leading-tight">
                {outfit.title}
              </Dialog.Title>
              <p className="mt-0.5 text-sm text-mystyle-muted">{outfit.reasoning}</p>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="ml-4 flex-shrink-0 rounded-lg p-1.5 text-mystyle-muted hover:bg-mystyle-stone/60 hover:text-mystyle-dark transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between px-5 py-3 bg-mystyle-cream/60 border-b border-mystyle-stone/40">
            <span className="text-sm text-mystyle-muted">Total</span>
            <span className="text-xl font-bold text-mystyle-dark">{formatPrice(outfit.totalPrice)}</span>
          </div>

          {/* Items */}
          <div className="flex-1 divide-y divide-mystyle-stone/40">
            {itemEntries.map(([category, product]) => (
              <div key={category} className="flex gap-4 p-5">
                {/* Image */}
                <ProductImage
                  product={product}
                  className="h-24 w-20 flex-shrink-0 rounded-xl"
                  showLabel={false}
                />

                {/* Info */}
                <div className="flex flex-1 flex-col justify-between min-w-0">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-mystyle-muted">
                      {categoryLabels[category] || category}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-mystyle-dark leading-tight line-clamp-2">
                      {product.name}
                    </p>
                    <p className="mt-0.5 text-xs text-mystyle-muted">{product.retailer}</p>
                  </div>

                  <div className="mt-2 space-y-1.5">
                    <InventoryBadge productId={product.id} category={product.category} />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-mystyle-dark">
                        {formatPrice(product.price)}
                      </span>
                      <a
                        href={getRetailerSearchUrl(product.retailer, product.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg bg-mystyle-dark px-2.5 py-1.5 text-[11px] font-semibold text-white transition-all hover:bg-mystyle-charcoal"
                      >
                        View <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
