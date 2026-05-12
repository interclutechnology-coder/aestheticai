import { z } from "zod";

// ─── Product ────────────────────────────────────────────────────────────────
export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(["top", "bottom", "outerwear", "shoes", "accessory"]),
  retailer: z.string(),
  price: z.number(),
  imageUrl: z.string(),
  color: z.string(),
  colorFamily: z.enum([
    "neutral",
    "earth",
    "blue",
    "warm",
    "cool",
    "dark",
    "white",
  ]),
  styleTags: z.array(z.string()),
  fit: z.enum([
    "slim",
    "regular",
    "oversized",
    "relaxed",
    "tailored",
    "cropped",
    "wide",
  ]),
  seasonTags: z.array(z.enum(["spring", "summer", "fall", "winter", "all"])),
  url: z.string(),
  gender: z.enum(["male", "female", "unisex"]).default("unisex"),
});

export type Product = z.infer<typeof ProductSchema>;

// ─── Filters ────────────────────────────────────────────────────────────────
export const FiltersSchema = z.object({
  budgetMin: z.number().min(0).max(2000).default(0),
  budgetMax: z.number().min(0).max(2000).default(500),
  retailers: z.array(z.string()).default([]),
  mixRetailers: z.boolean().default(true),
  gender: z.enum(["all", "male", "female"]).default("all"),
});

export type Filters = z.infer<typeof FiltersSchema>;

// ─── Generate Request ────────────────────────────────────────────────────────
export const GenerateRequestSchema = z.object({
  prompt: z.string().min(1).max(500),
  filters: FiltersSchema,
});

export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;

// ─── Outfit ─────────────────────────────────────────────────────────────────
export const OutfitItemsSchema = z.object({
  top: ProductSchema,
  bottom: ProductSchema,
  shoes: ProductSchema,
  outerwear: ProductSchema.optional(),
  accessory: ProductSchema.optional(),
});

export type OutfitItems = z.infer<typeof OutfitItemsSchema>;

export const OutfitSchema = z.object({
  outfitId: z.string(),
  title: z.string(),
  items: OutfitItemsSchema,
  totalPrice: z.number(),
  retailers: z.array(z.string()),
  reasoning: z.string(),
  trending: z.boolean().default(false),
  savedAt: z.string().optional(),
  lockedItems: z.record(z.string(), z.boolean()).optional(),
});

export type Outfit = z.infer<typeof OutfitSchema>;

// ─── Generation Result ───────────────────────────────────────────────────────
export const GenerateResultSchema = z.object({
  outfits: z.array(OutfitSchema),
  prompt: z.string(),
  filters: FiltersSchema,
  generatedAt: z.string(),
});

export type GenerateResult = z.infer<typeof GenerateResultSchema>;

// ─── Inventory Badge ─────────────────────────────────────────────────────────
export type InventoryBadge = {
  sizes: string[];
  lowStock: boolean;
  updatedHoursAgo: number;
};

// ─── Explore Preset ─────────────────────────────────────────────────────────
export type ExplorePreset = {
  id: string;
  title: string;
  description: string;
  prompt: string;
  filters: Partial<Filters>;
  accentColor: string;
  bgColor: string;
  previewColors: string[];
};

// ─── Waitlist ───────────────────────────────────────────────────────────────
export type WaitlistEntry = {
  email: string;
  addedAt: string;
};
