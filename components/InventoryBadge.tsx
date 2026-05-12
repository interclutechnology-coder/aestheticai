"use client";

import { Clock } from "lucide-react";
import { getInventoryBadge } from "@/lib/inventoryBadge";
import { cn } from "@/lib/utils";

interface InventoryBadgeProps {
  productId: string;
  category: string;
  className?: string;
}

export function InventoryBadge({ productId, category, className }: InventoryBadgeProps) {
  const badge = getInventoryBadge(productId, category);

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center flex-wrap gap-1">
        {badge.lowStock ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600 ring-1 ring-red-200">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            Only {2 + (productId.charCodeAt(0) % 3)} left
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            In stock
          </span>
        )}
        <div className="flex gap-1">
          {badge.sizes.map((size) => (
            <span
              key={size}
              className="rounded border border-mystyle-stone bg-white px-1.5 py-0.5 text-[10px] font-medium text-mystyle-charcoal"
            >
              {size}
            </span>
          ))}
        </div>
      </div>
      <p className="flex items-center gap-1 text-[10px] text-mystyle-muted">
        <Clock className="h-2.5 w-2.5" />
        Updated {badge.updatedHoursAgo}h ago
      </p>
    </div>
  );
}
