import type { Product, Filters } from "@/types";
import { outfitColorScore, fitBalanceScore } from "./colorRules";

export interface ScoredProduct {
  product: Product;
  score: number;
}

/**
 * Scores a single product against a set of style tags.
 * More tag overlap = higher score.
 */
export function scoreProductByTags(
  product: Product,
  targetTags: string[]
): number {
  if (targetTags.length === 0) return 0.5;
  const overlap = product.styleTags.filter((t) => targetTags.includes(t));
  return overlap.length / targetTags.length;
}

/**
 * Returns true if a product fits within the filter constraints.
 */
export function productMatchesFilters(
  product: Product,
  filters: Filters
): boolean {
  if (product.price < filters.budgetMin || product.price > filters.budgetMax) {
    return false;
  }
  if (filters.retailers.length > 0 && !filters.retailers.includes(product.retailer)) {
    return false;
  }
  // Gender filter: "all" = no restriction; "male" = male+unisex; "female" = female+unisex
  const genderFilter = filters.gender ?? "all";
  if (genderFilter !== "all") {
    const productGender = (product as Product & { gender?: string }).gender ?? "unisex";
    if (productGender !== "unisex" && productGender !== genderFilter) {
      return false;
    }
  }
  return true;
}

/**
 * Given a list of products for an outfit, compute a holistic outfit score.
 * Factors: tag overlap, color harmony, fit balance.
 */
export function scoreOutfit(
  items: Product[],
  targetTags: string[],
  totalBudget: number,
  maxBudget: number
): number {
  // 1) Tag score: avg tag overlap across all items
  const tagScores = items.map((p) => scoreProductByTags(p, targetTags));
  const avgTag = tagScores.reduce((a, b) => a + b, 0) / tagScores.length;

  // 2) Color harmony
  const colorScore = outfitColorScore(items);

  // 3) Fit balance (top vs bottom)
  const top = items.find((p) => p.category === "top");
  const bottom = items.find((p) => p.category === "bottom");
  const fitScore = top && bottom ? fitBalanceScore(top.fit, bottom.fit) : 0.7;

  // 4) Budget fit (penalty if going over budget)
  const budgetRatio = Math.min(1, totalBudget / maxBudget);
  const budgetScore = budgetRatio <= 1 ? 1 - budgetRatio * 0.2 : 0;

  // Weighted composite
  return (
    avgTag * 0.45 +
    colorScore * 0.25 +
    fitScore * 0.20 +
    budgetScore * 0.10
  );
}

/**
 * Picks the best `n` products from a pool by tag score,
 * with a small random perturbation to get variety across outfits.
 */
export function pickTopN(
  pool: Product[],
  targetTags: string[],
  n: number,
  seed: number = 0
): Product[] {
  const scored = pool.map((p, i) => ({
    product: p,
    score: scoreProductByTags(p, targetTags) + seededRandom(seed + i) * 0.15,
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, n).map((s) => s.product);
}

/** Simple seeded pseudo-random [0,1) for deterministic variance */
export function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}
