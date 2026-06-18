"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Wand2 } from "lucide-react";
import { motion } from "framer-motion";
import { FiltersPanel } from "@/components/FiltersPanel";
import { ExplorePresets } from "@/components/ExplorePresets";
import { useOutfitStore } from "@/store/outfitStore";
import type { Filters } from "@/types";

const QUICK_CHIPS = [
  { label: "Date Night", prompt: "date night romantic dinner" },
  { label: "Work", prompt: "business casual office outfit" },
  { label: "Streetwear", prompt: "streetwear urban casual" },
  { label: "Beach", prompt: "coastal beach day outfit" },
  { label: "Interview", prompt: "professional interview outfit" },
  { label: "Night Out", prompt: "night out party look" },
];

const EXAMPLE_PROMPTS = [
  { text: "old money dinner date under $200", label: "Old Money" },
  { text: "streetwear concert fit under $150, mix retailers", label: "Streetwear" },
  { text: "business casual office outfit under $120 from Uniqlo", label: "Business" },
  { text: "coastal beach day under $180", label: "Coastal" },
];

// Fashion-inspired color blocks for background collage
const COLLAGE_BLOCKS = [
  // Left side
  { color: "#C8A882", w: 110, h: 170, top: 6, left: 1 },
  { color: "#B85A42", w: 72, h: 72, top: 28, left: 7 },
  { color: "#4A3728", w: 52, h: 115, top: 56, left: 2 },
  { color: "#EDE5DC", w: 90, h: 90, top: 79, left: 9 },
  { color: "#D4B8A8", w: 60, h: 60, top: 45, left: 15 },
  { color: "#8B3A2A", w: 38, h: 80, top: 88, left: 2 },
  // Right side
  { color: "#D4B8A8", w: 125, h: 70, top: 10, left: 79 },
  { color: "#8B3A2A", w: 62, h: 125, top: 36, left: 88 },
  { color: "#B0A090", w: 80, h: 80, top: 67, left: 90 },
  { color: "#C8A882", w: 45, h: 45, top: 50, left: 80 },
  { color: "#F5EFE6", w: 68, h: 95, top: 83, left: 83 },
  { color: "#4A3728", w: 42, h: 42, top: 22, left: 75 },
  // Subtle top/bottom touches
  { color: "#D4B8A8", w: 95, h: 48, top: 2, left: 38 },
  { color: "#B85A42", w: 36, h: 36, top: 5, left: 60 },
  { color: "#C8A882", w: 55, h: 85, top: 87, left: 62 },
];

export default function HomePage() {
  const router = useRouter();
  const { prompt, filters, setPrompt, setFilters, setOutfits, setLoading } = useOutfitStore();
  const [localPrompt, setLocalPrompt] = useState(prompt || "");
  const [localFilters, setLocalFilters] = useState<Filters>(
    filters ?? {
      budgetMin: 0,
      budgetMax: 500,
      retailers: [],
      mixRetailers: true,
      gender: "all" as const,
    }
  );
  const [showFilters, setShowFilters] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleGenerate = () => {
    if (!localPrompt.trim()) return;
    setPrompt(localPrompt.trim());
    setFilters(localFilters);
    setOutfits([]);
    setLoading(true);
    router.push("/results");
  };

  const handleSurprise = () => {
    const surprises = [
      "vintage boho festival outfit",
      "quiet luxury office look",
      "coastal grandmother aesthetic",
      "clean girl morning errands outfit",
      "old money summer weekend",
      "minimalist date night",
    ];
    const pick = surprises[Math.floor(Math.random() * surprises.length)];
    setLocalPrompt(pick);
    textareaRef.current?.focus();
  };

  const setChip = (chipPrompt: string) => {
    setLocalPrompt(chipPrompt);
    textareaRef.current?.focus();
  };

  const setExample = (text: string) => {
    setLocalPrompt(text);
    textareaRef.current?.focus();
  };

  return (
    <div className="relative min-h-[calc(100vh-56px)] overflow-hidden">
      {/* ── Animated fashion collage background ── */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        {COLLAGE_BLOCKS.map((block, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: block.w,
              height: block.h,
              top: `${block.top}%`,
              left: `${block.left}%`,
              backgroundColor: block.color,
              borderRadius: 6,
              opacity: 0.16,
              animation: `drift ${7 + (i % 5) * 1.8}s ease-in-out ${(i % 6) * 0.7}s infinite alternate`,
            }}
          />
        ))}
      </div>

      {/* ── Main content ── */}
      <div className="mx-auto max-w-3xl px-4 pb-14 pt-7 sm:px-6">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-mystyle-warm/30 bg-mystyle-warm/10 px-3 py-1.5 text-xs font-semibold text-mystyle-accent">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Outfit Styling
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-mystyle-dark sm:text-4xl md:text-5xl">
            Find your perfect outfit
            <span className="block text-mystyle-accent">in seconds.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-mystyle-muted sm:text-base">
            Describe your vibe, set your budget, and get AI-curated outfit recommendations from real brands.
          </p>
        </motion.div>

        {/* Main input card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl border border-mystyle-stone bg-white/95 p-5 shadow-lg backdrop-blur-sm sm:p-6"
        >
          {/* Prompt textarea */}
          <div className="relative">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-mystyle-muted">
              Describe your style
            </label>
            <textarea
              ref={textareaRef}
              value={localPrompt}
              onChange={(e) => setLocalPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
              placeholder="e.g. old money dinner date under $200…"
              rows={2}
              className="w-full resize-none rounded-xl border border-mystyle-stone bg-mystyle-cream/40 px-4 py-3 text-sm text-mystyle-dark placeholder:text-mystyle-muted/60 focus:outline-none focus:ring-2 focus:ring-mystyle-accent/50 transition-all"
            />
          </div>

          {/* Quick chips */}
          <div className="mt-3 flex flex-wrap gap-2">
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => setChip(chip.prompt)}
                className="rounded-full border border-mystyle-stone bg-mystyle-cream/60 px-3 py-1 text-xs font-medium text-mystyle-charcoal transition-all hover:border-mystyle-muted hover:bg-mystyle-stone/50"
              >
                {chip.label}
              </button>
            ))}
            <button
              type="button"
              onClick={handleSurprise}
              className="flex items-center gap-1 rounded-full border border-mystyle-warm/40 bg-mystyle-warm/10 px-3 py-1 text-xs font-medium text-mystyle-accent transition-all hover:bg-mystyle-warm/20"
            >
              <Wand2 className="h-3 w-3" />
              Surprise Me
            </button>
          </div>

          {/* Filters toggle */}
          <div className="mt-4 border-t border-mystyle-stone/60 pt-4">
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className="flex items-center gap-2 text-xs font-semibold text-mystyle-muted hover:text-mystyle-dark transition-colors"
            >
              <span className={`transition-transform duration-200 ${showFilters ? "rotate-180" : ""}`}>
                ▾
              </span>
              {showFilters ? "Hide filters" : "Show filters"}
              <span className="ml-1 rounded-full bg-mystyle-stone/60 px-1.5 py-0.5 text-[10px]">
                ${localFilters.budgetMin}–${localFilters.budgetMax}
                {localFilters.retailers.length > 0
                  ? ` · ${localFilters.retailers.length} retailer${localFilters.retailers.length > 1 ? "s" : ""}`
                  : ""}
              </span>
            </button>

            <motion.div
              initial={false}
              animate={{ height: showFilters ? "auto" : 0, opacity: showFilters ? 1 : 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="pt-4">
                <FiltersPanel filters={localFilters} onChange={setLocalFilters} />
              </div>
            </motion.div>
          </div>

          {/* CTA */}
          <div className="mt-5">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!localPrompt.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-mystyle-dark py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-mystyle-charcoal hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Sparkles className="h-4 w-4" />
              Generate Outfits
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>

        {/* Example prompts */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-5"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-mystyle-muted">
            Example prompts
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {EXAMPLE_PROMPTS.map((ex) => (
              <button
                key={ex.text}
                type="button"
                onClick={() => setExample(ex.text)}
                className="group flex items-start gap-3 rounded-xl border border-mystyle-stone bg-white/90 p-3.5 text-left backdrop-blur-sm transition-all hover:border-mystyle-muted hover:shadow-sm"
              >
                <span className="mt-0.5 flex-shrink-0 rounded-md bg-mystyle-stone/60 px-1.5 py-0.5 text-[10px] font-bold text-mystyle-muted">
                  {ex.label}
                </span>
                <p className="text-xs leading-relaxed text-mystyle-charcoal group-hover:text-mystyle-dark">
                  &ldquo;{ex.text}&rdquo;
                </p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Explore presets */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8"
        >
          <ExplorePresets />
        </motion.div>

        {/* Footer hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center text-xs text-mystyle-muted/60"
        >
          No account needed · Results are instant · Powered by real inventory data
        </motion.p>
      </div>
    </div>
  );
}
