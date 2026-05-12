import type { Product } from "@/types";

type ColorFamily =
  | "neutral"
  | "earth"
  | "blue"
  | "warm"
  | "cool"
  | "dark"
  | "white";

// Color harmony compatibility matrix
// A value of 1 = compatible, 0 = incompatible
const COLOR_HARMONY: Record<ColorFamily, Record<ColorFamily, number>> = {
  white:   { white: 1, neutral: 1, earth: 1, blue: 1, warm: 1, cool: 1, dark: 1 },
  neutral: { white: 1, neutral: 1, earth: 1, blue: 1, warm: 1, cool: 1, dark: 1 },
  earth:   { white: 1, neutral: 1, earth: 1, blue: 0.7, warm: 1, cool: 0.5, dark: 1 },
  blue:    { white: 1, neutral: 1, earth: 0.7, blue: 1, warm: 0.5, cool: 0.8, dark: 1 },
  warm:    { white: 1, neutral: 1, earth: 1, blue: 0.5, warm: 0.7, cool: 0.3, dark: 0.8 },
  cool:    { white: 1, neutral: 1, earth: 0.5, blue: 0.8, warm: 0.3, cool: 0.7, dark: 0.8 },
  dark:    { white: 1, neutral: 1, earth: 1, blue: 1, warm: 0.8, cool: 0.8, dark: 0.7 },
};

/**
 * Returns a score [0, 1] representing how well two color families pair together.
 */
export function colorHarmonyScore(a: ColorFamily, b: ColorFamily): number {
  return COLOR_HARMONY[a]?.[b] ?? 0.5;
}

/**
 * Computes an aggregate color harmony score for an array of products.
 * Averages pairwise scores across all color family combinations.
 */
export function outfitColorScore(products: Product[]): number {
  if (products.length < 2) return 1;
  const families = products.map((p) => p.colorFamily as ColorFamily);
  let total = 0;
  let count = 0;
  for (let i = 0; i < families.length; i++) {
    for (let j = i + 1; j < families.length; j++) {
      total += colorHarmonyScore(families[i], families[j]);
      count++;
    }
  }
  return count > 0 ? total / count : 1;
}

/**
 * Fit balance pairs: some fits work better together.
 */
const FIT_BALANCE: Record<string, Record<string, number>> = {
  oversized: { slim: 1, regular: 0.8, tailored: 0.9, wide: 0.4, oversized: 0.3, relaxed: 0.5, cropped: 1 },
  slim:      { slim: 0.7, regular: 0.9, tailored: 1, wide: 0.8, oversized: 1, relaxed: 0.8, cropped: 0.9 },
  tailored:  { slim: 1, regular: 0.9, tailored: 0.7, wide: 0.7, oversized: 0.8, relaxed: 0.7, cropped: 0.9 },
  wide:      { slim: 0.8, regular: 0.7, tailored: 0.7, wide: 0.3, oversized: 0.4, relaxed: 0.6, cropped: 1 },
  regular:   { slim: 0.9, regular: 0.8, tailored: 0.9, wide: 0.7, oversized: 0.8, relaxed: 0.9, cropped: 0.8 },
  relaxed:   { slim: 0.8, regular: 0.9, tailored: 0.7, wide: 0.6, oversized: 0.5, relaxed: 0.7, cropped: 0.9 },
  cropped:   { slim: 0.9, regular: 0.8, tailored: 0.9, wide: 1, oversized: 1, relaxed: 0.9, cropped: 0.4 },
};

export function fitBalanceScore(topFit: string, bottomFit: string): number {
  return FIT_BALANCE[topFit]?.[bottomFit] ?? 0.6;
}
