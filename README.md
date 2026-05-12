# MyStyle.ai

> AI-powered outfit recommendation platform — demo-ready MVP.

## Quick Start

```bash
cd mystyle-ai
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## How the Generator Works

### 1. Prompt Parsing (`lib/generator.ts → parsePromptToTags`)

The prompt is lowercased and matched against a keyword → style-tag dictionary (`KEYWORD_MAP`). E.g.:

- `"old money dinner date"` → tags: `["old-money", "preppy", "classic", "night-out", "feminine", "minimalist"]`
- `"streetwear concert fit"` → tags: `["streetwear", "edgy", "casual", "night-out"]`

Budget override is also parsed from the prompt (`"under $200"` → `budgetMax: 200`).

### 2. Inventory Filtering

Products are loaded from `data/inventory.json` and filtered by:
- **Price range** (budgetMin / budgetMax)
- **Retailer allowlist** (if retailers are selected)
- **Single-retailer mode** (all items from one store)

### 3. Outfit Building (scoring system)

For each outfit slot, products are scored by:

| Factor | Weight | Description |
|--------|--------|-------------|
| Tag overlap | 45% | How many of the target style tags a product shares |
| Color harmony | 25% | `lib/colorRules.ts` — compatibility matrix between color families |
| Fit balance | 20% | Oversized top pairs better with slim/wide bottom, etc. |
| Budget fit | 10% | Penalizes outfits that use the full budget |

A small seeded random perturbation creates variety between the 6–10 generated outfits.

### 4. Outfit Composition

Each outfit contains:
- **Top** (required)
- **Bottom** (required)
- **Shoes** (required)
- **Outerwear** (optional, ~60% inclusion, budget-gated)
- **Accessory** (optional, ~70% inclusion, budget-gated)

### 5. Swap Logic (`getSwapAlternatives`)

Swapping an item finds alternatives:
1. Same category
2. Within remaining budget (total budget − all other items)
3. Same retailer constraints (if single-retailer mode)
4. Scored by tag overlap to the current item's tags
5. Deduplicated against already-present items

---

## Where Inventory Lives

`data/inventory.json` — an array of ~120 `Product` objects.

**Product schema:**

```ts
{
  id: string;
  name: string;
  category: "top" | "bottom" | "outerwear" | "shoes" | "accessory";
  retailer: string;
  price: number;
  imageUrl: string;        // placehold.co URL (replaceable)
  color: string;           // descriptive (e.g. "dark-wash")
  colorFamily: "neutral" | "earth" | "blue" | "warm" | "cool" | "dark" | "white";
  styleTags: string[];     // e.g. ["old-money", "minimalist"]
  fit: "slim" | "regular" | "oversized" | "relaxed" | "tailored" | "cropped" | "wide";
  seasonTags: string[];
  url: string;             // retailer product URL
}
```

---

## Replacing Inventory with Real Affiliate Feeds

The codebase is designed with an **adapter pattern** in mind.

### Interface to implement

Create `lib/inventoryAdapter.ts`:

```ts
export interface InventoryAdapter {
  /** Fetch products, optionally filtered */
  fetchProducts(filters?: {
    categories?: string[];
    retailers?: string[];
    maxPrice?: number;
  }): Promise<Product[]>;
}
```

### Steps

1. **Remove static import** in `lib/generator.ts`:
   ```ts
   // Before (mock)
   import inventory from "@/data/inventory.json";
   const INVENTORY = inventory as Product[];

   // After (real feed)
   import { createAdapter } from "@/lib/inventoryAdapter";
   const adapter = createAdapter(); // your implementation
   const INVENTORY = await adapter.fetchProducts();
   ```

2. **Implement the adapter** for your affiliate network (e.g. ShareASale, CJ Affiliate, Rakuten):
   ```ts
   // lib/adapters/shareasaleAdapter.ts
   export function createShareASaleAdapter(): InventoryAdapter {
     return {
       async fetchProducts(filters) {
         const res = await fetch(`https://api.shareasale.com/...`);
         const raw = await res.json();
         return raw.products.map(normalizeProduct); // map to Product type
       }
     };
   }
   ```

3. **Add caching** (Redis / edge KV) since affiliate API calls are slow — the `Product[]` shape doesn't change.

4. **Image URLs**: Affiliate feeds provide real product CDN images. Replace `placehold.co` URLs in the `imageUrl` field. The `ProductCollage` and `OutfitCard` components use Next.js `<Image>` — just add the new hostname to `next.config.ts`:
   ```ts
   remotePatterns: [
     { protocol: "https", hostname: "cdn.affiliate-network.com" }
   ]
   ```

---

## Project Structure

```
mystyle-ai/
├── app/
│   ├── layout.tsx           # Root layout (Nav + Toaster)
│   ├── page.tsx             # Home page
│   ├── globals.css
│   ├── results/
│   │   └── page.tsx         # Results page (SwipeDeck)
│   ├── saved/
│   │   └── page.tsx         # Saved outfits
│   └── api/generate/
│       └── route.ts         # POST = generate, PUT = swap alternatives
├── components/
│   ├── Nav.tsx
│   ├── OutfitCard.tsx       # Single outfit card with swap/save
│   ├── SwipeDeck.tsx        # Animated deck + grid view toggle
│   ├── OutfitModal.tsx      # Outfit detail drawer
│   ├── BuyOutfitModal.tsx   # "Buy Entire Outfit" modal
│   ├── FiltersPanel.tsx     # Budget slider + retailer chips
│   ├── FiltersDrawer.tsx    # Radix Dialog wrapper for FiltersPanel
│   ├── ExplorePresets.tsx   # 6 preset style cards on home
│   ├── ProductCollage.tsx   # Image grid collage
│   ├── InventoryBadge.tsx   # "In stock · S/M/L" badge
│   ├── SkeletonCard.tsx     # Loading skeleton
│   └── SwapMenu.tsx         # Per-category swap dropdown
├── lib/
│   ├── generator.ts         # Core outfit generation logic
│   ├── scoring.ts           # Tag scoring + fit balance
│   ├── colorRules.ts        # Color harmony matrix
│   ├── inventoryBadge.ts    # Deterministic fake inventory status
│   ├── presets.ts           # 6 explore preset definitions
│   ├── storage.ts           # localStorage helpers
│   └── utils.ts             # cn(), formatPrice(), filtersToKey()
├── store/
│   └── outfitStore.ts       # Zustand store (persisted)
├── types/
│   └── index.ts             # Zod schemas + TypeScript types
└── data/
    └── inventory.json       # ~120 mock products
```

---

## State Management

State flows through a **Zustand store** (`store/outfitStore.ts`) that is persisted to `localStorage`. This means:

- Refreshing `/results` keeps the current generation
- Navigating Home → Results preserves the last outfits
- `prompt` + `filters` are shared between pages

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Primitives | Radix UI |
| Animation | Framer Motion |
| State | Zustand (persisted) |
| Validation | Zod |
| Notifications | Sonner |
| Persistence | localStorage |
