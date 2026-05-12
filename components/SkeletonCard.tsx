"use client";

import { cn } from "@/lib/utils";

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gradient-to-r from-mystyle-stone via-mystyle-cream to-mystyle-stone bg-[length:200%_100%] animate-shimmer",
        className
      )}
    />
  );
}

export function SkeletonOutfitCard() {
  return (
    <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-mystyle-stone bg-white shadow-xl">
      {/* Collage skeleton */}
      <Shimmer className="h-72 w-full rounded-none" />

      <div className="p-5 space-y-4">
        {/* Title */}
        <div className="space-y-2">
          <Shimmer className="h-5 w-3/4" />
          <Shimmer className="h-3.5 w-1/2" />
        </div>

        {/* Price + retailers */}
        <div className="flex items-center justify-between">
          <Shimmer className="h-7 w-24" />
          <Shimmer className="h-5 w-20" />
        </div>

        {/* Reasoning */}
        <Shimmer className="h-4 w-full" />

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Shimmer className="h-10 rounded-xl" />
          <Shimmer className="h-10 rounded-xl" />
        </div>
        <Shimmer className="h-10 rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonRow({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonOutfitCard key={i} />
      ))}
    </div>
  );
}
