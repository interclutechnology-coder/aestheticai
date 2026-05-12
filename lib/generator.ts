import type { Product, Outfit, Filters, OutfitItems } from "@/types";
import inventory from "@/data/inventory.json";
import { productMatchesFilters, scoreProductByTags, seededRandom, scoreOutfit } from "./scoring";
import { fitBalanceScore } from "./colorRules";

// Cast the raw JSON to Product[]
const INVENTORY = inventory as Product[];

// ─── Keyword → StyleTag mapping ─────────────────────────────────────────────
const KEYWORD_MAP: Record<string, string[]> = {
  "old money":      ["old-money", "preppy", "classic"],
  "dinner":         ["old-money", "night-out", "feminine", "minimalist"],
  "date":           ["night-out", "feminine", "minimalist", "old-money"],
  "date night":     ["night-out", "feminine", "minimalist"],
  "streetwear":     ["streetwear", "edgy", "casual"],
  "street":         ["streetwear", "casual"],
  "concert":        ["streetwear", "edgy", "casual", "night-out"],
  "beach":          ["coastal", "casual", "boho"],
  "coastal":        ["coastal", "casual", "boho", "feminine"],
  "business":       ["business-casual", "minimalist", "old-money"],
  "office":         ["business-casual", "minimalist"],
  "casual":         ["casual", "minimalist"],
  "boho":           ["boho", "coastal", "feminine"],
  "bohemian":       ["boho", "coastal", "feminine"],
  "minimalist":     ["minimalist", "classic"],
  "minimal":        ["minimalist"],
  "night out":      ["night-out", "edgy", "feminine"],
  "party":          ["night-out", "edgy", "feminine"],
  "club":           ["night-out", "edgy"],
  "athleisure":     ["athleisure", "streetwear", "casual"],
  "gym":            ["athleisure"],
  "preppy":         ["preppy", "old-money", "coastal"],
  "feminine":       ["feminine", "boho", "old-money"],
  "edgy":           ["edgy", "streetwear", "night-out"],
  "summer":         ["coastal", "casual"],
  "winter":         ["old-money", "minimalist"],
  "classic":        ["old-money", "minimalist", "classic"],
  "interview":      ["business-casual", "minimalist", "old-money"],
  "work":           ["business-casual", "minimalist"],
  "formal":         ["old-money", "business-casual", "night-out"],
  "surprise":       ["casual", "streetwear", "minimalist", "coastal"],
};

/**
 * Parses a user prompt into an array of style tags.
 */
export function parsePromptToTags(prompt: string): string[] {
  const lower = prompt.toLowerCase();
  const tags = new Set<string>();

  for (const [keyword, styleTags] of Object.entries(KEYWORD_MAP)) {
    if (lower.includes(keyword)) {
      styleTags.forEach((t) => tags.add(t));
    }
  }

  // If nothing matched, default to casual
  if (tags.size === 0) {
    ["casual", "minimalist"].forEach((t) => tags.add(t));
  }

  return Array.from(tags);
}

/**
 * Parses a budget from a prompt string if present (e.g. "under $200").
 */
export function parseBudgetFromPrompt(prompt: string): number | null {
  const match = prompt.match(/under\s+\$?(\d+)/i) || prompt.match(/\$(\d+)/i);
  if (match) return parseInt(match[1], 10);
  return null;
}

// ─── Outfit Title generation ─────────────────────────────────────────────────
const OUTFIT_ADJECTIVES = [
  "Refined", "Effortless", "Bold", "Classic", "Modern", "Polished",
  "Relaxed", "Elevated", "Minimal", "Chic", "Fresh", "Sharp",
];

const OUTFIT_NOUNS = [
  "Look", "Fit", "Ensemble", "Style", "Moment", "Edit",
];

function makeOutfitTitle(index: number, primaryTag: string): string {
  const adj = OUTFIT_ADJECTIVES[index % OUTFIT_ADJECTIVES.length];
  const noun = OUTFIT_NOUNS[index % OUTFIT_NOUNS.length];
  const tagLabel = primaryTag
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return `${adj} ${tagLabel} ${noun} #${index + 1}`;
}

// ─── Reasoning line generation ────────────────────────────────────────────────
const REASONING_TEMPLATES = [
  (tags: string[], colors: string[]) =>
    `${colors[0] || "Neutral"} palette with ${tags[0] || "versatile"} styling — polished and intentional.`,
  (tags: string[], colors: string[]) =>
    `Tailored silhouette meets ${tags[0] || "elevated"} essentials in a ${colors[0] || "harmonious"} tone.`,
  (tags: string[], colors: string[]) =>
    `${tags[0] ? tags[0].charAt(0).toUpperCase() + tags[0].slice(1) : "Classic"} vibes anchored by clean ${colors[0] || "neutral"} tones.`,
  (tags: string[], colors: string[]) =>
    `Confident ${tags[0] || "modern"} energy — ${colors[0] || "tonal"} tones and considered proportions.`,
  (tags: string[], colors: string[]) =>
    `A cohesive ${tags[0] || "everyday"} look built around ${colors[0] || "timeless"} color pairings.`,
  (tags: string[], _colors: string[]) =>
    `Easy ${tags[0] || "casual"} dressing with a polished, effortless edge.`,
];

function makeReasoning(tags: string[], items: Product[], index: number): string {
  const fn = REASONING_TEMPLATES[index % REASONING_TEMPLATES.length];
  const colors = Array.from(new Set(items.map((p) => p.color.replace(/-/g, " ")))).slice(0, 2);
  return fn(tags, colors);
}

// ─── Single outfit builder ───────────────────────────────────────────────────
function buildOutfit(
  tops: Product[],
  bottoms: Product[],
  shoes: Product[],
  outerwear: Product[],
  accessories: Product[],
  targetTags: string[],
  filters: Filters,
  seed: number,
  index: number
): Outfit | null {
  // Pick top
  const scoredTops = tops.map((p, i) => ({
    p,
    score: scoreProductByTags(p, targetTags) + seededRandom(seed + i) * 0.2,
  })).sort((a, b) => b.score - a.score);

  if (scoredTops.length === 0) return null;
  const top = scoredTops[index % Math.max(1, Math.min(scoredTops.length, 8))].p;

  // Pick bottom compatible with top (fit balance)
  const scoredBottoms = bottoms.map((p, i) => ({
    p,
    score:
      scoreProductByTags(p, targetTags) * 0.5 +
      fitBalanceScore(top.fit, p.fit) * 0.3 +
      seededRandom(seed + i + 100) * 0.2,
  })).sort((a, b) => b.score - a.score);

  if (scoredBottoms.length === 0) return null;
  const bottom = scoredBottoms[index % Math.max(1, Math.min(scoredBottoms.length, 8))].p;

  // Pick shoes
  const scoredShoes = shoes.map((p, i) => ({
    p,
    score: scoreProductByTags(p, targetTags) + seededRandom(seed + i + 200) * 0.2,
  })).sort((a, b) => b.score - a.score);

  if (scoredShoes.length === 0) return null;
  const shoe = scoredShoes[index % Math.max(1, Math.min(scoredShoes.length, 8))].p;

  const basePrice = top.price + bottom.price + shoe.price;

  // Optional outerwear (include ~60% of the time, if budget allows)
  let outer: Product | undefined;
  if (outerwear.length > 0 && seededRandom(seed + 300) > 0.4) {
    const scoredOuter = outerwear.map((p, i) => ({
      p,
      score: scoreProductByTags(p, targetTags) + seededRandom(seed + i + 300) * 0.2,
    })).sort((a, b) => b.score - a.score);
    const candidate = scoredOuter[index % Math.max(1, Math.min(scoredOuter.length, 5))].p;
    if (basePrice + candidate.price <= filters.budgetMax) {
      outer = candidate;
    }
  }

  // Optional accessory (include ~70% of the time, if budget allows)
  let acc: Product | undefined;
  const priceWithOuter = basePrice + (outer?.price ?? 0);
  if (accessories.length > 0 && seededRandom(seed + 400) > 0.3) {
    const scoredAcc = accessories.map((p, i) => ({
      p,
      score: scoreProductByTags(p, targetTags) + seededRandom(seed + i + 400) * 0.2,
    })).sort((a, b) => b.score - a.score);
    const candidate = scoredAcc[index % Math.max(1, Math.min(scoredAcc.length, 5))].p;
    if (priceWithOuter + candidate.price <= filters.budgetMax) {
      acc = candidate;
    }
  }

  const allItems = [top, bottom, shoe, ...(outer ? [outer] : []), ...(acc ? [acc] : [])];
  const totalPrice = allItems.reduce((s, p) => s + p.price, 0);

  // Check total price fits budget
  if (totalPrice > filters.budgetMax) return null;

  const retailers = Array.from(new Set(allItems.map((p) => p.retailer)));

  // Enforce single-retailer constraint
  if (!filters.mixRetailers && retailers.length > 1) return null;

  const items: OutfitItems = {
    top,
    bottom,
    shoes: shoe,
    ...(outer && { outerwear: outer }),
    ...(acc && { accessory: acc }),
  };

  const overallScore = scoreOutfit(allItems, targetTags, totalPrice, filters.budgetMax);
  const trending = overallScore > 0.75 && seededRandom(seed + 500) > 0.6;

  return {
    outfitId: `outfit-${Date.now()}-${index}-${seed}`,
    title: makeOutfitTitle(index, targetTags[0] || "casual"),
    items,
    totalPrice: Math.round(totalPrice * 100) / 100,
    retailers,
    reasoning: makeReasoning(targetTags, allItems, index),
    trending,
  };
}

// ─── Main generator ───────────────────────────────────────────────────────────
export interface GenerateOptions {
  prompt: string;
  filters: Filters;
  count?: number;
}

export function generateOutfits(options: GenerateOptions): Outfit[] {
  const { prompt, filters, count = 8 } = options;

  const targetTags = parsePromptToTags(prompt);

  // Override budget from prompt if specified
  const promptBudget = parseBudgetFromPrompt(prompt);
  const effectiveFilters: Filters = {
    ...filters,
    budgetMax: promptBudget ?? filters.budgetMax,
  };

  // Filter inventory by budget & retailers
  const eligible = INVENTORY.filter((p) =>
    productMatchesFilters(p, effectiveFilters)
  );

  // Partition by category
  const tops = eligible.filter((p) => p.category === "top");
  const bottoms = eligible.filter((p) => p.category === "bottom");
  const shoes = eligible.filter((p) => p.category === "shoes");
  const outerwear = eligible.filter((p) => p.category === "outerwear");
  const accessories = eligible.filter((p) => p.category === "accessory");

  // Need at least tops, bottoms, shoes
  if (tops.length === 0 || bottoms.length === 0 || shoes.length === 0) {
    return [];
  }

  const outfits: Outfit[] = [];
  const seed = prompt.length * 13 + effectiveFilters.budgetMax;
  const attempts = count * 4; // try more to account for failures

  for (let i = 0; i < attempts && outfits.length < count; i++) {
    const outfit = buildOutfit(
      tops, bottoms, shoes, outerwear, accessories,
      targetTags, effectiveFilters, seed + i * 7, i
    );
    if (outfit) {
      // Deduplicate: avoid the exact same top+bottom+shoe combo
      const key = `${outfit.items.top.id}-${outfit.items.bottom.id}-${outfit.items.shoes.id}`;
      if (!outfits.some((o) =>
        `${o.items.top.id}-${o.items.bottom.id}-${o.items.shoes.id}` === key
      )) {
        outfits.push(outfit);
      }
    }
  }

  return outfits;
}

// ─── Swap logic ───────────────────────────────────────────────────────────────
export function getSwapAlternatives(
  currentItem: Product,
  outfit: Outfit,
  filters: Filters,
  count: number = 8
): Product[] {
  const currentTotal = outfit.totalPrice;
  const remainingBudget = filters.budgetMax - (currentTotal - currentItem.price);

  const pool = (INVENTORY as Product[]).filter((p) => {
    if (p.id === currentItem.id) return false;
    if (p.category !== currentItem.category) return false;
    if (p.price > remainingBudget) return false;
    if (filters.retailers.length > 0 && !filters.retailers.includes(p.retailer)) return false;
    if (!filters.mixRetailers) {
      const outfitRetailer = outfit.retailers[0];
      if (p.retailer !== outfitRetailer) return false;
    }
    return true;
  });

  const targetTags = currentItem.styleTags;
  const seed = currentItem.id.charCodeAt(0) * 17;

  const scored = pool.map((p, i) => ({
    p,
    score: scoreProductByTags(p, targetTags) + seededRandom(seed + i) * 0.15,
  }));
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, count).map((s) => s.p);
}
