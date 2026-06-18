"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, Upload, X, CheckCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface PhotoUploadProps {
  onUpload: (url: string) => void;
  currentUrl?: string | null;
}

export function PhotoUpload({ onUpload, currentUrl }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Upload failed");

      onUpload(data.url);
      toast.success("Photo uploaded!", { description: "We'll use this for your outfit try-on." });
    } catch (err) {
      toast.error("Upload failed", { description: err instanceof Error ? err.message : "Try again" });
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }, [onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleRemove = () => {
    setPreview(null);
    onUpload("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {preview ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative flex items-center gap-3 rounded-xl border border-mystyle-stone bg-mystyle-cream/40 p-3"
          >
            <div className="relative h-14 w-11 flex-shrink-0 overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Your photo" className="h-full w-full object-cover" />
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              {uploading ? (
                <p className="text-xs text-mystyle-muted">Uploading photo…</p>
              ) : (
                <>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                    <p className="text-xs font-semibold text-mystyle-dark">Photo ready</p>
                  </div>
                  <p className="text-[11px] text-mystyle-muted mt-0.5">
                    Outfits will be styled on you
                  </p>
                </>
              )}
            </div>
            {!uploading && (
              <button
                type="button"
                onClick={handleRemove}
                className="rounded-lg p-1.5 text-mystyle-muted hover:bg-mystyle-stone/60 hover:text-mystyle-dark transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`w-full flex items-center gap-3 rounded-xl border-2 border-dashed p-3.5 text-left transition-all ${
                isDragging
                  ? "border-mystyle-accent bg-mystyle-accent/5"
                  : "border-mystyle-stone/60 bg-mystyle-cream/40 hover:border-mystyle-muted hover:bg-mystyle-stone/20"
              }`}
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-mystyle-stone/40">
                <Camera className="h-5 w-5 text-mystyle-muted" />
              </div>
              <div>
                <p className="text-sm font-semibold text-mystyle-dark">
                  Upload your photo
                  <span className="ml-1.5 text-xs font-normal text-mystyle-muted">(optional)</span>
                </p>
                <p className="text-[11px] text-mystyle-muted mt-0.5">
                  See yourself wearing each outfit · JPG or PNG · Max 10MB
                </p>
              </div>
              <Upload className="ml-auto h-4 w-4 flex-shrink-0 text-mystyle-muted/60" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
