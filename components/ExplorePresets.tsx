"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import type { Filters } from "@/types";
import { EXPLORE_PRESETS } from "@/lib/presets";
import { ColorTiles } from "./ProductCollage";
import { useOutfitStore } from "@/store/outfitStore";

export function ExplorePresets() {
  const router = useRouter();
  const { setPrompt, setFilters, setOutfits, setLoading } = useOutfitStore();

  const handlePreset = async (presetId: string) => {
    const preset = EXPLORE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const defaultFilters: Filters = {
      budgetMin: 0,
      budgetMax: 500,
      retailers: [],
      mixRetailers: true,
      gender: "all",
    };

    const filters: Filters = { ...defaultFilters, ...preset.filters } as Filters;

    setPrompt(preset.prompt);
    setFilters(filters);
    setLoading(true);
    setOutfits([]);
    router.push("/results");
  };

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-mystyle-dark">Explore Styles</h2>
        <p className="mt-1 text-sm text-mystyle-muted">
          Pick a vibe and we&apos;ll build the outfit.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {EXPLORE_PRESETS.map((preset, i) => (
          <motion.div
            key={preset.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.07 }}
          >
            <button
              type="button"
              onClick={() => handlePreset(preset.id)}
              className="group relative flex w-full flex-col overflow-hidden rounded-2xl border border-mystyle-stone/60 bg-white text-left shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
            >
              {/* Top color band */}
              <div
                className="h-2 w-full"
                style={{
                  background: `linear-gradient(90deg, ${preset.previewColors.join(", ")})`,
                }}
              />

              <div className="p-4 space-y-3">
                {/* Color tiles */}
                <ColorTiles colors={preset.previewColors} />

                {/* Text */}
                <div>
                  <h3 className="text-sm font-bold text-mystyle-dark">{preset.title}</h3>
                  <p className="mt-0.5 text-xs text-mystyle-muted leading-snug">
                    {preset.description}
                  </p>
                </div>

                {/* CTA */}
                <div className="flex items-center gap-1 text-xs font-semibold text-mystyle-accent transition-all group-hover:gap-2">
                  Try this style
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
