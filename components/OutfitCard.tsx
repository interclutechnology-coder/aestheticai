"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Bookmark, BookmarkCheck, Loader2, User, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { Outfit } from "@/types";
import { saveOutfit, removeOutfit, isOutfitSaved } from "@/lib/storage";
import { useOutfitStore } from "@/store/outfitStore";
import { OutfitModal } from "./OutfitModal";

interface OutfitCardProps {
  outfit: Outfit;
  index?: number;
  onSaveChange?: () => void;
}

export function OutfitCard({ outfit, index = 0, onSaveChange }: OutfitCardProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [saved, setSaved] = useState(() => isOutfitSaved(outfit.outfitId));

  // AI-generated images
  const [outfitImageUrl, setOutfitImageUrl] = useState<string | null>(null);
  const [garmentImageUrl, setGarmentImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageFailed, setImageFailed] = useState(false);
  const requestedRef = useRef(false);

  // Virtual try-on
  const [tryOnUrl, setTryOnUrl] = useState<string | null>(null);
  const [tryOnLoading, setTryOnLoading] = useState(false);

  const { userPhotoUrl } = useOutfitStore();

  // Step 1 — generate AI outfit photo + garment product shot
  useEffect(() => {
    if (requestedRef.current) return;
    requestedRef.current = true;

    fetch("/api/generate-outfit-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        outfitId: outfit.outfitId,
        items: outfit.items,
        title: outfit.title,
        reasoning: outfit.reasoning,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.imageUrl) {
          setOutfitImageUrl(data.imageUrl);
        } else {
          setImageFailed(true); // null = API error (billing, timeout, etc.)
        }
        if (data.garmentImageUrl) setGarmentImageUrl(data.garmentImageUrl);
      })
      .catch((err) => {
        console.error("[OutfitCard] image gen failed:", err);
        setImageFailed(true);
      })
      .finally(() => setImageLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outfit.outfitId]);

  // Step 2 — virtual try-on once we have both user photo + garment image
  useEffect(() => {
    if (!userPhotoUrl || !garmentImageUrl) return;
    if (tryOnUrl || tryOnLoading) return;

    setTryOnLoading(true);
    fetch("/api/tryon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userPhotoUrl,
        garmentImageUrl,
        garmentDescription: outfit.items.top?.name ?? "clothing item",
      }),
    })
      .then((r) => r.json())
      .then((data) => { if (data.imageUrl) setTryOnUrl(data.imageUrl); })
      .catch(() => {})
      .finally(() => setTryOnLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPhotoUrl, garmentImageUrl]);

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (saved) {
      removeOutfit(outfit.outfitId);
      setSaved(false);
      toast.success("Outfit removed from saved");
    } else {
      saveOutfit(outfit);
      setSaved(true);
      toast.success("Outfit saved!", { description: "Find it in your Saved tab." });
    }
    onSaveChange?.();
  };

  // Priority: try-on photo > outfit photo > loading
  const displayUrl = tryOnUrl ?? outfitImageUrl ?? null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: index * 0.06 }}
        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-mystyle-stone bg-white shadow-sm hover:shadow-xl transition-all duration-300"
        onClick={() => setDetailOpen(true)}
      >
        {/* Trending badge */}
        {outfit.trending && (
          <div className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-mystyle-dark/90 px-2.5 py-1 text-[10px] font-bold text-white shadow backdrop-blur-sm">
            <TrendingUp className="h-3 w-3" />
            Trending
          </div>
        )}

        {/* Save button */}
        <button
          type="button"
          onClick={handleSave}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow backdrop-blur-sm transition-all hover:scale-110 hover:bg-white"
          title={saved ? "Remove from saved" : "Save outfit"}
        >
          {saved ? (
            <BookmarkCheck className="h-4 w-4 text-mystyle-accent" />
          ) : (
            <Bookmark className="h-4 w-4 text-mystyle-muted" />
          )}
        </button>

        {/* Image area — portrait ratio for full-body model */}
        <div className="aspect-[2/3] w-full overflow-hidden relative bg-mystyle-cream/40">

          {displayUrl ? (
            // AI-generated model photo or try-on result
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayUrl}
              alt={tryOnUrl ? `You wearing ${outfit.title}` : outfit.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : imageFailed ? (
            // Generation failed (billing, timeout, etc.) — show styled gradient fallback
            <div className="h-full w-full flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-mystyle-cream via-mystyle-stone/20 to-mystyle-accent/10 px-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-mystyle-accent/10 border border-mystyle-accent/20">
                <Sparkles className="h-8 w-8 text-mystyle-accent/60" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-mystyle-dark line-clamp-2">{outfit.title}</p>
                <p className="text-[10px] text-mystyle-muted mt-1">Tap to view outfit details</p>
              </div>
            </div>
          ) : (
            // Still loading — spinner
            <div className="h-full w-full flex flex-col items-center justify-center gap-3">
              <div className="relative">
                <div className="h-14 w-14 rounded-full border-2 border-mystyle-stone/30 bg-mystyle-stone/10" />
                <Loader2 className="absolute inset-0 m-auto h-7 w-7 animate-spin text-mystyle-accent" />
              </div>
              <div className="text-center px-4">
                <p className="text-xs font-semibold text-mystyle-dark">Generating look…</p>
                <p className="text-[10px] text-mystyle-muted mt-0.5">AI is styling your outfit</p>
              </div>
            </div>
          )}

          {/* Status badge overlay on image */}
          {displayUrl && (
            <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
              {tryOnUrl ? (
                <><User className="h-3 w-3" /> You in this</>
              ) : tryOnLoading ? (
                <><Loader2 className="h-3 w-3 animate-spin" /> Styling you…</>
              ) : (
                <><Sparkles className="h-3 w-3" /> AI Look</>
              )}
            </div>
          )}
        </div>

        {/* Bottom info strip */}
        <div className="p-3.5">
          <h3 className="text-sm font-semibold text-mystyle-dark leading-tight line-clamp-1">
            {outfit.title}
          </h3>
          <p className="mt-0.5 text-[11px] text-mystyle-muted truncate">
            {outfit.retailers.join(" · ")}
          </p>
          <p className="mt-1.5 text-[10px] text-mystyle-muted/50 group-hover:text-mystyle-accent transition-colors">
            Tap to view pieces &amp; prices →
          </p>
        </div>
      </motion.div>

      <OutfitModal
        outfit={outfit}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onSaveChange={onSaveChange}
        tryOnUrl={tryOnUrl}
        outfitImageUrl={outfitImageUrl}
      />
    </>
  );
}
