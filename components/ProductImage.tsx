"use client";

import { useState } from "react";
import type { Product } from "@/types";
import { cn } from "@/lib/utils";

type ColorFamily = "white" | "neutral" | "earth" | "blue" | "warm" | "cool" | "dark";

const GRADIENT_CONFIG: Record<
  ColorFamily,
  { from: string; to: string; textColor: string; patternColor: string }
> = {
  white:   { from: "#F5F3F0", to: "#E0DBD3", textColor: "#2D2926", patternColor: "#C8B89A" },
  neutral: { from: "#D8D0C8", to: "#B8A898", textColor: "#2D2926", patternColor: "#9A8E82" },
  earth:   { from: "#D4BCA0", to: "#9A7A5A", textColor: "#FAF8F5", patternColor: "#FAF8F5" },
  blue:    { from: "#6B9EC4", to: "#1E4D8C", textColor: "#FAF8F5", patternColor: "#A8C8E8" },
  warm:    { from: "#F0DDD0", to: "#D4A898", textColor: "#2D2926", patternColor: "#8B6F4E" },
  cool:    { from: "#C0DED4", to: "#5A9AB0", textColor: "#FAF8F5", patternColor: "#E8F5F0" },
  dark:    { from: "#4A4036", to: "#1A1714", textColor: "#FAF8F5", patternColor: "#C8A882" },
};

const CATEGORY_SHAPES: Record<string, React.ReactNode> = {
  top: (
    <svg viewBox="0 0 48 48" className="h-10 w-10 opacity-20" fill="currentColor">
      <path d="M6 8l10-4 8 8 8-8 10 4-4 12h-4v20H12V20H8L6 8z" />
    </svg>
  ),
  bottom: (
    <svg viewBox="0 0 48 48" className="h-10 w-10 opacity-20" fill="currentColor">
      <path d="M8 8h32l-4 12-8 20h-8L12 20 8 8z" />
    </svg>
  ),
  shoes: (
    <svg viewBox="0 0 48 48" className="h-10 w-10 opacity-20" fill="currentColor">
      <path d="M4 32c0 4 3 8 8 8h24c4 0 8-4 6-8l-6-16H16L4 32z" />
    </svg>
  ),
  outerwear: (
    <svg viewBox="0 0 48 48" className="h-10 w-10 opacity-20" fill="currentColor">
      <path d="M4 10l10-4 10 10 10-10 10 4-4 14h-4v20H8V24H4L4 10z" />
    </svg>
  ),
  accessory: (
    <svg viewBox="0 0 48 48" className="h-10 w-10 opacity-20" fill="currentColor">
      <circle cx="24" cy="24" r="14" />
      <circle cx="24" cy="24" r="8" fill="none" strokeWidth="2" stroke="currentColor" />
    </svg>
  ),
};

interface ProductImageProps {
  product: Product;
  className?: string;
  showLabel?: boolean;
}

export function ProductImage({ product, className, showLabel = true }: ProductImageProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const cf = (product.colorFamily || "neutral") as ColorFamily;
  const { from, to, textColor, patternColor } = GRADIENT_CONFIG[cf] ?? GRADIENT_CONFIG.neutral;

  const showRealImage = !imgError && !!product.imageUrl;

  return (
    <div
      className={cn("relative flex flex-col overflow-hidden", className)}
      style={{ background: `linear-gradient(145deg, ${from} 0%, ${to} 100%)` }}
    >
      {/* Gradient skeleton / fallback background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, ${patternColor}33 1px, transparent 1px)`,
          backgroundSize: "12px 12px",
        }}
      />

      {/* Silhouette shown when image hasn't loaded yet */}
      {(!imgLoaded || imgError) && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ color: textColor }}
        >
          {CATEGORY_SHAPES[product.category] ?? CATEGORY_SHAPES.accessory}
        </div>
      )}

      {/* Real product image */}
      {showRealImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.imageUrl}
          alt={product.name}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
            imgLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
        />
      )}

      {/* Bottom label */}
      {showLabel && (
        <div
          className="absolute bottom-0 inset-x-0 p-2 z-10"
          style={{ background: `linear-gradient(to top, ${to}EE, transparent)` }}
        >
          <p
            className="text-[10px] font-semibold leading-tight line-clamp-1"
            style={{ color: showRealImage && imgLoaded ? "#FAF8F5" : textColor }}
          >
            {product.name}
          </p>
          <p className="text-[9px] opacity-70 mt-0.5" style={{ color: showRealImage && imgLoaded ? "#FAF8F5" : textColor }}>
            {product.retailer}
          </p>
        </div>
      )}

      {/* Price tag top-right */}
      <div
        className="absolute right-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold backdrop-blur-sm z-10"
        style={{ background: `${from}CC`, color: textColor }}
      >
        ${product.price}
      </div>
    </div>
  );
}
