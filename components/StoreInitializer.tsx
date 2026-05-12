"use client";

import { useEffect } from "react";
import { useOutfitStore } from "@/store/outfitStore";

export function StoreInitializer() {
  useEffect(() => {
    useOutfitStore.persist.rehydrate();
  }, []);
  return null;
}
