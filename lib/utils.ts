import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

export function filtersToKey(filters: import("@/types").Filters): string {
  return JSON.stringify({
    budgetMin: filters.budgetMin,
    budgetMax: filters.budgetMax,
    retailers: [...filters.retailers].sort(),
    mixRetailers: filters.mixRetailers,
  });
}
