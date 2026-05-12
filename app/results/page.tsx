"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Wand2, SlidersHorizontal, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useOutfitStore } from "@/store/outfitStore";
import { SwipeDeck } from "@/components/SwipeDeck";
import { SkeletonRow } from "@/components/SkeletonCard";
import { FiltersDrawer } from "@/components/FiltersDrawer";
import { formatPrice } from "@/lib/utils";

export default function ResultsPage() {
  const router = useRouter();
  const {
    prompt,
    filters,
    outfits,
    isLoading,
    setOutfits,
    setLoading,
    setFilters,
  } = useOutfitStore();

  const [error, setError] = useState<string | null>(null);
  const [saveVersion, setSaveVersion] = useState(0);

  const generate = useCallback(
    async (currentPrompt: string, currentFilters: typeof filters, surpriseMode = false) => {
      if (!currentPrompt.trim()) {
        router.push("/");
        return;
      }

      setLoading(true);
      setError(null);

      let effectivePrompt = currentPrompt;
      if (surpriseMode) {
        const surprises = [
          "vintage boho weekend look",
          "coastal grandmother aesthetic",
          "quiet luxury minimalist",
          "dark academic autumn outfit",
          "clean girl aesthetic",
          "preppy coastal club outfit",
        ];
        effectivePrompt = surprises[Math.floor(Math.random() * surprises.length)];
      }

      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: effectivePrompt, filters: currentFilters }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Generation failed");
        }

        setOutfits(data.outfits);
        toast.success(`${data.outfits.length} outfits generated!`, {
          description: `Based on: "${effectivePrompt}"`,
        });
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Something went wrong";
        setError(msg);
        toast.error("Generation failed", { description: msg });
      } finally {
        setLoading(false);
      }
    },
    [router, setLoading, setOutfits]
  );

  // Auto-generate on mount if we have a prompt but no outfits
  useEffect(() => {
    if (prompt && (outfits.length === 0 || isLoading)) {
      generate(prompt, filters);
    } else if (!prompt) {
      router.push("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only on mount

  const hasResults = outfits.length > 0;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-14 pt-6 sm:px-6">
      {/* Top bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <p className="text-xs font-semibold uppercase tracking-widest text-mystyle-muted">
              Results
            </p>
          </div>
          <h1 className="mt-1 text-xl font-bold text-mystyle-dark line-clamp-1">
            &ldquo;{prompt}&rdquo;
          </h1>
          <p className="mt-0.5 text-xs text-mystyle-muted">
            Budget: {formatPrice(filters.budgetMin)}–{formatPrice(filters.budgetMax)}
            {filters.retailers.length > 0 && (
              <> · {filters.retailers.join(", ")}</>
            )}
            {!filters.mixRetailers && " · Single retailer"}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
          <FiltersDrawer filters={filters} onChange={setFilters} />

          <button
            type="button"
            onClick={() => generate(prompt, filters, true)}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-mystyle-stone bg-white px-4 py-2 text-sm font-medium text-mystyle-dark shadow-sm transition-all hover:bg-mystyle-cream disabled:opacity-50"
          >
            <Wand2 className="h-4 w-4" />
            Surprise Me
          </button>

          <button
            type="button"
            onClick={() => generate(prompt, filters)}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-mystyle-dark px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-mystyle-charcoal disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Regenerate
          </button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Loading header */}
            <div className="mb-8 rounded-2xl border border-mystyle-stone bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mystyle-dark">
                  <Sparkles className="h-5 w-5 text-mystyle-cream animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-mystyle-dark">
                    Building your outfits…
                  </p>
                  <p className="text-xs text-mystyle-muted">
                    Analyzing inventory · Matching style tags · Optimizing color harmony
                  </p>
                </div>
              </div>
              {/* Fake progress bar */}
              <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-mystyle-stone">
                <motion.div
                  className="h-full rounded-full bg-mystyle-accent"
                  initial={{ width: "0%" }}
                  animate={{ width: "90%" }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              </div>
            </div>
            <SkeletonRow count={3} />
          </motion.div>
        )}

        {!isLoading && error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 py-20 text-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
              <AlertCircle className="h-7 w-7 text-red-500" />
            </div>
            <div>
              <p className="text-base font-semibold text-mystyle-dark">
                Couldn&apos;t generate outfits
              </p>
              <p className="mt-1 text-sm text-mystyle-muted">{error}</p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="rounded-xl border border-mystyle-stone bg-white px-5 py-2.5 text-sm font-medium text-mystyle-dark hover:bg-mystyle-cream"
              >
                Change prompt
              </button>
              <button
                type="button"
                onClick={() => generate(prompt, filters)}
                className="rounded-xl bg-mystyle-dark px-5 py-2.5 text-sm font-semibold text-white hover:bg-mystyle-charcoal"
              >
                Try again
              </button>
            </div>
          </motion.div>
        )}

        {!isLoading && !error && hasResults && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <SwipeDeck
              outfits={outfits}
              onSaveChange={() => setSaveVersion((v) => v + 1)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
