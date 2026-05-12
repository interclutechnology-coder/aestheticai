"use client";

import type { OutfitItems } from "@/types";
import { cn } from "@/lib/utils";
import { ProductImage } from "./ProductImage";

interface ProductCollageProps {
  items: OutfitItems;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ProductCollage({ items, size = "md", className }: ProductCollageProps) {
  const mainItems = [
    { product: items.top,    label: "Top" },
    { product: items.bottom, label: "Bottom" },
    { product: items.shoes,  label: "Shoes" },
  ];

  const extraItems = [
    ...(items.outerwear ? [{ product: items.outerwear, label: "Outer" }] : []),
    ...(items.accessory  ? [{ product: items.accessory,  label: "Acc" }] : []),
  ];

  const heights = { sm: "h-36", md: "h-56", lg: "h-72" }[size];

  return (
    <div className={cn("flex gap-1 overflow-hidden rounded-xl", heights, className)}>
      {mainItems.map(({ product }) => (
        <ProductImage
          key={product.id}
          product={product}
          className="flex-1 rounded-lg transition-transform duration-300 hover:scale-[1.02]"
        />
      ))}
      {extraItems.length > 0 && (
        <div className="flex w-[27%] flex-col gap-1">
          {extraItems.map(({ product }) => (
            <ProductImage
              key={product.id}
              product={product}
              className="flex-1 rounded-lg"
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Small tile version for explore presets / saved cards
interface ColorTilesProps {
  colors: string[];
  className?: string;
}

export function ColorTiles({ colors, className }: ColorTilesProps) {
  return (
    <div className={cn("flex gap-1.5 flex-wrap", className)}>
      {colors.map((color, i) => (
        <div
          key={i}
          className="h-8 w-8 rounded-md border border-white/20 shadow-sm"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}
