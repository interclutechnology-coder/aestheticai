import type { InventoryBadge } from "@/types";

const SIZE_POOLS = {
  clothing: ["XS", "S", "M", "L", "XL", "XXL"],
  shoes: ["6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11"],
  accessories: ["One Size"],
};

const SHOE_CATEGORIES = ["shoes"];
const ACCESSORY_CATEGORIES = ["accessory"];

/**
 * Deterministically generates an inventory badge for a product
 * based on its id (so it's consistent per session but looks "live").
 */
export function getInventoryBadge(productId: string, category: string): InventoryBadge {
  // Use the product id to seed a deterministic hash
  const hash = productId.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

  let pool: string[];
  if (SHOE_CATEGORIES.includes(category)) {
    pool = SIZE_POOLS.shoes;
  } else if (ACCESSORY_CATEGORIES.includes(category)) {
    pool = SIZE_POOLS.accessories;
  } else {
    pool = SIZE_POOLS.clothing;
  }

  // Pick 2–4 sizes deterministically
  const sizeCount = 2 + (hash % 3); // 2, 3, or 4
  const startIdx = hash % pool.length;
  const sizes: string[] = [];
  for (let i = 0; i < sizeCount; i++) {
    sizes.push(pool[(startIdx + i) % pool.length]);
  }

  // ~10% chance of "low stock"
  const lowStock = hash % 10 === 7;

  // "Updated X hours ago" — between 1 and 23 hours
  const updatedHoursAgo = 1 + (hash % 23);

  return { sizes, lowStock, updatedHoursAgo };
}
