import type { Outfit, WaitlistEntry } from "@/types";

const SAVED_OUTFITS_KEY = "mystyle_saved_outfits";
const WAITLIST_KEY = "mystyle_waitlist";
const GENERATION_CACHE_KEY = "mystyle_last_generation";

// ─── Saved Outfits ───────────────────────────────────────────────────────────

export function getSavedOutfits(): Outfit[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVED_OUTFITS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveOutfit(outfit: Outfit): void {
  const outfits = getSavedOutfits();
  const existing = outfits.findIndex((o) => o.outfitId === outfit.outfitId);
  if (existing !== -1) return; // already saved

  const withTimestamp: Outfit = {
    ...outfit,
    savedAt: new Date().toISOString(),
  };
  outfits.unshift(withTimestamp);
  localStorage.setItem(SAVED_OUTFITS_KEY, JSON.stringify(outfits));
}

export function removeOutfit(outfitId: string): void {
  const outfits = getSavedOutfits().filter((o) => o.outfitId !== outfitId);
  localStorage.setItem(SAVED_OUTFITS_KEY, JSON.stringify(outfits));
}

export function isOutfitSaved(outfitId: string): boolean {
  return getSavedOutfits().some((o) => o.outfitId === outfitId);
}

// ─── Waitlist ────────────────────────────────────────────────────────────────

export function getWaitlistEmails(): WaitlistEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WAITLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToWaitlist(email: string): boolean {
  const entries = getWaitlistEmails();
  if (entries.some((e) => e.email.toLowerCase() === email.toLowerCase())) {
    return false; // already on list
  }
  entries.push({ email, addedAt: new Date().toISOString() });
  localStorage.setItem(WAITLIST_KEY, JSON.stringify(entries));
  return true;
}

// ─── Generation cache ─────────────────────────────────────────────────────────

export interface GenerationCache {
  prompt: string;
  filtersKey: string;
  outfits: Outfit[];
  generatedAt: string;
}

export function cacheGeneration(data: GenerationCache): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(GENERATION_CACHE_KEY, JSON.stringify(data));
}

export function getCachedGeneration(
  prompt: string,
  filtersKey: string
): GenerationCache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(GENERATION_CACHE_KEY);
    if (!raw) return null;
    const data: GenerationCache = JSON.parse(raw);
    if (data.prompt === prompt && data.filtersKey === filtersKey) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearGenerationCache(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GENERATION_CACHE_KEY);
}
