"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, LayoutGrid, Layers } from "lucide-react";
import type { Outfit } from "@/types";
import { OutfitCard } from "./OutfitCard";
import { cn } from "@/lib/utils";

interface SwipeDeckProps {
  outfits: Outfit[];
  onSaveChange?: () => void;
}

type ViewMode = "deck" | "grid";

export function SwipeDeck({ outfits, onSaveChange }: SwipeDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("deck");

  const goTo = (index: number) => {
    if (index < 0 || index >= outfits.length) return;
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.2 },
    }),
  };

  return (
    <div className="w-full">
      {/* View mode toggle */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-mystyle-muted">
          {outfits.length} outfit{outfits.length !== 1 ? "s" : ""} generated
        </p>
        <div className="flex items-center gap-1 rounded-xl border border-mystyle-stone bg-white p-1">
          <button
            type="button"
            onClick={() => setViewMode("deck")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              viewMode === "deck"
                ? "bg-mystyle-dark text-white shadow-sm"
                : "text-mystyle-muted hover:text-mystyle-dark"
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            Deck
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              viewMode === "grid"
                ? "bg-mystyle-dark text-white shadow-sm"
                : "text-mystyle-muted hover:text-mystyle-dark"
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Grid
          </button>
        </div>
      </div>

      {viewMode === "deck" ? (
        <div className="w-full">
          {/* Side-peek deck layout */}
          <div className="relative flex items-start justify-center gap-3">
            {/* Prev ghost */}
            {currentIndex > 0 && (
              <button
                type="button"
                onClick={() => goTo(currentIndex - 1)}
                className="hidden lg:block w-52 flex-shrink-0 opacity-40 hover:opacity-60 transition-opacity mt-8"
              >
                <OutfitCard
                  outfit={outfits[currentIndex - 1]}
                  index={0}
                  showSwap={false}
                />
              </button>
            )}
            {currentIndex === 0 && <div className="hidden lg:block w-52 flex-shrink-0" />}

            {/* Main card */}
            <div className="relative w-full max-w-md flex-shrink-0 overflow-hidden">
              <AnimatePresence custom={direction} mode="wait">
                <motion.div
                  key={outfits[currentIndex]?.outfitId}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  <OutfitCard
                    outfit={outfits[currentIndex]}
                    index={0}
                    onSaveChange={onSaveChange}
                    showSwap
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Next ghost */}
            {currentIndex < outfits.length - 1 && (
              <button
                type="button"
                onClick={() => goTo(currentIndex + 1)}
                className="hidden lg:block w-52 flex-shrink-0 opacity-40 hover:opacity-60 transition-opacity mt-8"
              >
                <OutfitCard
                  outfit={outfits[currentIndex + 1]}
                  index={0}
                  showSwap={false}
                />
              </button>
            )}
            {currentIndex === outfits.length - 1 && <div className="hidden lg:block w-52 flex-shrink-0" />}
          </div>

          {/* Navigation */}
          <div className="mt-5 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => goTo(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-mystyle-stone bg-white shadow-sm transition-all hover:bg-mystyle-stone/40 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4 text-mystyle-dark" />
            </button>

            <div className="flex items-center gap-1.5">
              {outfits.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  className={cn(
                    "rounded-full transition-all",
                    i === currentIndex
                      ? "h-2 w-5 bg-mystyle-dark"
                      : "h-2 w-2 bg-mystyle-stone hover:bg-mystyle-muted"
                  )}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => goTo(currentIndex + 1)}
              disabled={currentIndex === outfits.length - 1}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-mystyle-stone bg-white shadow-sm transition-all hover:bg-mystyle-stone/40 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4 text-mystyle-dark" />
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-mystyle-muted">
            {currentIndex + 1} / {outfits.length}
          </p>
        </div>
      ) : (
        /* Grid view */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {outfits.map((outfit, i) => (
            <OutfitCard
              key={outfit.outfitId}
              outfit={outfit}
              index={i}
              onSaveChange={onSaveChange}
              showSwap
            />
          ))}
        </div>
      )}
    </div>
  );
}
