"use client";

import * as Slider from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";
import type { Filters } from "@/types";

const RETAILERS = [
  "Zara", "Uniqlo", "Nike", "Abercrombie", "H&M",
  "Banana Republic", "ASOS", "Levi's", "Free People",
];

interface FiltersPanelProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  className?: string;
}

export function FiltersPanel({ filters, onChange, className }: FiltersPanelProps) {
  const toggleRetailer = (retailer: string) => {
    const next = filters.retailers.includes(retailer)
      ? filters.retailers.filter((r) => r !== retailer)
      : [...filters.retailers, retailer];
    onChange({ ...filters, retailers: next });
  };

  const GENDER_OPTIONS: { value: Filters["gender"]; label: string }[] = [
    { value: "all",    label: "All" },
    { value: "female", label: "Women" },
    { value: "male",   label: "Men" },
  ];

  return (
    <div className={cn("space-y-5", className)}>
      {/* Gender selector */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-mystyle-dark">Gender</label>
        <div className="flex gap-2">
          {GENDER_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange({ ...filters, gender: value })}
              className={cn(
                "flex-1 rounded-xl border py-2 text-xs font-semibold transition-all",
                filters.gender === value
                  ? "border-mystyle-dark bg-mystyle-dark text-white"
                  : "border-mystyle-stone bg-white text-mystyle-charcoal hover:border-mystyle-muted"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {/* Budget Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-mystyle-dark">Budget</label>
          <span className="text-sm font-medium text-mystyle-accent">
            ${filters.budgetMin} – ${filters.budgetMax}
          </span>
        </div>
        <Slider.Root
          className="relative flex h-5 w-full touch-none select-none items-center"
          min={0}
          max={1000}
          step={25}
          value={[filters.budgetMin, filters.budgetMax]}
          onValueChange={([min, max]) =>
            onChange({ ...filters, budgetMin: min, budgetMax: max })
          }
        >
          <Slider.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-mystyle-stone">
            <Slider.Range className="absolute h-full bg-mystyle-accent rounded-full" />
          </Slider.Track>
          <Slider.Thumb className="block h-4 w-4 rounded-full border-2 border-mystyle-accent bg-white shadow-md ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mystyle-accent focus-visible:ring-offset-2 cursor-grab active:cursor-grabbing" />
          <Slider.Thumb className="block h-4 w-4 rounded-full border-2 border-mystyle-accent bg-white shadow-md ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mystyle-accent focus-visible:ring-offset-2 cursor-grab active:cursor-grabbing" />
        </Slider.Root>
        <div className="flex justify-between text-xs text-mystyle-muted">
          <span>$0</span>
          <span>$1,000</span>
        </div>
      </div>

      {/* Retailer chips */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-mystyle-dark">Retailers</label>
        <div className="flex flex-wrap gap-2">
          {RETAILERS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => toggleRetailer(r)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-all",
                filters.retailers.includes(r)
                  ? "border-mystyle-dark bg-mystyle-dark text-white"
                  : "border-mystyle-stone bg-white text-mystyle-charcoal hover:border-mystyle-muted"
              )}
            >
              {r}
            </button>
          ))}
        </div>
        {filters.retailers.length > 0 && (
          <button
            type="button"
            onClick={() => onChange({ ...filters, retailers: [] })}
            className="text-xs text-mystyle-muted underline underline-offset-2 hover:text-mystyle-charcoal"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Mix retailers toggle */}
      <div className="flex items-center justify-between rounded-xl border border-mystyle-stone bg-mystyle-cream/50 p-3">
        <div>
          <p className="text-sm font-semibold text-mystyle-dark">Mix Retailers</p>
          <p className="text-xs text-mystyle-muted">
            {filters.mixRetailers
              ? "Items from different stores"
              : "Keep all items from one store"}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={filters.mixRetailers}
          onClick={() => onChange({ ...filters, mixRetailers: !filters.mixRetailers })}
          className={cn(
            "relative h-6 w-11 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mystyle-accent focus-visible:ring-offset-2",
            filters.mixRetailers ? "bg-mystyle-dark" : "bg-mystyle-stone"
          )}
        >
          <span
            className={cn(
              "block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
              "absolute top-1",
              filters.mixRetailers ? "translate-x-6" : "translate-x-1"
            )}
          />
        </button>
      </div>
    </div>
  );
}
