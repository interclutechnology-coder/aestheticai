"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Outfit, Filters } from "@/types";

interface OutfitStore {
  // Current generation state
  prompt: string;
  filters: Filters;
  outfits: Outfit[];
  currentIndex: number;
  isLoading: boolean;

  // User photo for virtual try-on
  userPhotoUrl: string | null;
  setUserPhotoUrl: (url: string | null) => void;

  // Generated image cache — keyed by outfitId, prevents re-calling Replicate on nav back
  outfitImages: Record<string, { imageUrl: string | null; garmentImageUrl: string | null }>;
  setOutfitImage: (outfitId: string, imageUrl: string | null, garmentImageUrl: string | null) => void;

  // Actions
  setPrompt: (prompt: string) => void;
  setFilters: (filters: Filters) => void;
  setOutfits: (outfits: Outfit[]) => void;
  setCurrentIndex: (index: number) => void;
  setLoading: (loading: boolean) => void;

  // Swap an item in an outfit
  swapItem: (
    outfitId: string,
    category: keyof Outfit["items"],
    newItem: import("@/types").Product
  ) => void;

  // Toggle lock on an item
  toggleLock: (outfitId: string, category: string) => void;

  // Clear generation
  clearGeneration: () => void;
}

const DEFAULT_FILTERS: Filters = {
  budgetMin: 0,
  budgetMax: 500,
  retailers: [],
  mixRetailers: true,
  gender: "all",
};

export const useOutfitStore = create<OutfitStore>()(
  persist(
    (set) => ({
      prompt: "",
      filters: DEFAULT_FILTERS,
      outfits: [],
      currentIndex: 0,
      isLoading: false,
      userPhotoUrl: null,
      outfitImages: {},

      setUserPhotoUrl: (userPhotoUrl) => set({ userPhotoUrl }),
      setOutfitImage: (outfitId, imageUrl, garmentImageUrl) =>
        set((state) => ({
          outfitImages: { ...state.outfitImages, [outfitId]: { imageUrl, garmentImageUrl } },
        })),
      setPrompt: (prompt) => set({ prompt }),
      setFilters: (filters) => set({ filters }),
      setOutfits: (outfits) => set({ outfits, currentIndex: 0 }),
      setCurrentIndex: (currentIndex) => set({ currentIndex }),
      setLoading: (isLoading) => set({ isLoading }),

      swapItem: (outfitId, category, newItem) =>
        set((state) => ({
          outfits: state.outfits.map((outfit) => {
            if (outfit.outfitId !== outfitId) return outfit;
            const updatedItems = { ...outfit.items, [category]: newItem };
            const allItems = Object.values(updatedItems).filter(Boolean) as import("@/types").Product[];
            const totalPrice = allItems.reduce((s, p) => s + p.price, 0);
            const retailers = Array.from(new Set(allItems.map((p) => p.retailer)));
            return {
              ...outfit,
              items: updatedItems,
              totalPrice: Math.round(totalPrice * 100) / 100,
              retailers,
            };
          }),
        })),

      toggleLock: (outfitId, category) =>
        set((state) => ({
          outfits: state.outfits.map((outfit) => {
            if (outfit.outfitId !== outfitId) return outfit;
            const locked = { ...(outfit.lockedItems ?? {}) };
            locked[category] = !locked[category];
            return { ...outfit, lockedItems: locked };
          }),
        })),

      clearGeneration: () =>
        set({ outfits: [], currentIndex: 0, isLoading: false, outfitImages: {} }),
    }),
    {
      name: "mystyle-outfit-store-v3", // v3: adds outfitImages cache for Replicate image deduplication
      skipHydration: true,
      partialize: (state) => ({
        prompt: state.prompt,
        filters: state.filters,
        outfits: state.outfits,
        currentIndex: state.currentIndex,
        userPhotoUrl: state.userPhotoUrl,
        outfitImages: state.outfitImages, // persist so images survive page refresh
      }),
    }
  )
);
