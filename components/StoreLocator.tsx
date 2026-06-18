"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, MapPin, Navigation, Store, Clock, Star, ExternalLink, Loader2 } from "lucide-react";

interface StoreLocatorProps {
  open: boolean;
  onClose: () => void;
  retailers: string[];
}

interface RealStore {
  name: string;
  address: string;
  retailer: string;
  distance: string;
  openNow: boolean | null;
  rating: number | null;
  mapsUrl: string;
}

export function StoreLocator({ open, onClose, retailers }: StoreLocatorProps) {
  const [zipCode, setZipCode] = useState("");
  const [stores, setStores] = useState<RealStore[]>([]);
  const [locationLabel, setLocationLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchStores = async (lat?: number, lng?: number, zip?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng, zipCode: zip, retailers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setStores(data.stores || []);
      setLocationLabel(data.locationLabel || zip || "your location");
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by your browser");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => searchStores(pos.coords.latitude, pos.coords.longitude),
      () => {
        setLoading(false);
        setError("Could not get your location — try entering a zip code instead");
      }
    );
  };

  const handleZipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (zipCode.trim().length >= 3) searchStores(undefined, undefined, zipCode.trim());
  };

  const handleReset = () => {
    setSubmitted(false);
    setStores([]);
    setZipCode("");
    setLocationLabel("");
    setError(null);
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-x-4 top-1/2 z-[60] max-h-[80vh] -translate-y-1/2 overflow-y-auto rounded-2xl bg-white shadow-2xl sm:inset-x-auto sm:left-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-mystyle-stone/60 p-5">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-mystyle-accent/10">
                <MapPin className="h-4 w-4 text-mystyle-accent" />
              </div>
              <Dialog.Title className="text-base font-semibold text-mystyle-dark">
                Find Stores Near You
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button type="button" className="rounded-lg p-1.5 text-mystyle-muted hover:bg-mystyle-stone/60 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="p-5">
            {!submitted ? (
              <div className="space-y-4">
                <p className="text-sm text-mystyle-muted">
                  Find stores near you carrying:{" "}
                  <span className="font-medium text-mystyle-dark">{retailers.join(", ")}</span>
                </p>

                {error && (
                  <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
                )}

                <button
                  type="button"
                  onClick={handleLocate}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-mystyle-dark py-3 text-sm font-semibold text-white hover:bg-mystyle-charcoal disabled:opacity-50 transition-all"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Navigation className="h-4 w-4" />
                  )}
                  {loading ? "Searching…" : "Use My Current Location"}
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-mystyle-stone" />
                  <span className="text-xs text-mystyle-muted">or</span>
                  <div className="flex-1 border-t border-mystyle-stone" />
                </div>

                <form onSubmit={handleZipSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="Enter zip code"
                    maxLength={10}
                    className="flex-1 rounded-xl border border-mystyle-stone bg-mystyle-cream/40 px-4 py-2.5 text-sm text-mystyle-dark placeholder:text-mystyle-muted/60 focus:outline-none focus:ring-2 focus:ring-mystyle-accent/50"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-xl border border-mystyle-stone bg-white px-4 py-2.5 text-sm font-medium text-mystyle-dark hover:bg-mystyle-stone/40 disabled:opacity-50 transition-all"
                  >
                    Search
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm font-medium text-mystyle-dark">
                  Stores near {locationLabel}:
                </p>

                {stores.length === 0 ? (
                  <div className="py-8 text-center text-sm text-mystyle-muted">
                    <Store className="mx-auto mb-2 h-8 w-8 opacity-30" />
                    <p>No stores found within 10 miles.</p>
                    <p className="mt-1 text-xs">Try a different location or check online.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {stores.map((store, i) => (
                      <div key={i} className="rounded-xl border border-mystyle-stone bg-mystyle-cream/30 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-mystyle-dark text-white text-xs font-bold">
                              {store.retailer.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-mystyle-dark">{store.name}</p>
                              <p className="text-xs text-mystyle-muted">{store.address}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                <span className="text-[11px] font-semibold text-mystyle-accent">
                                  {store.distance}
                                </span>
                                {store.openNow !== null && (
                                  <span className={`text-[11px] font-medium ${store.openNow ? "text-emerald-600" : "text-red-500"}`}>
                                    {store.openNow ? "Open now" : "Closed"}
                                  </span>
                                )}
                                {store.rating && (
                                  <span className="flex items-center gap-0.5 text-[11px] text-mystyle-muted">
                                    <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                                    {store.rating}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <a
                            href={store.mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0 flex items-center gap-1 rounded-lg border border-mystyle-stone bg-white px-2.5 py-1.5 text-[11px] font-medium text-mystyle-dark hover:bg-mystyle-stone/40 transition-all"
                          >
                            <MapPin className="h-3 w-3" />
                            Directions
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-center text-[10px] text-mystyle-muted/60">
                  Powered by Google Maps · In-store stock not guaranteed
                </p>

                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full rounded-xl border border-mystyle-stone py-2 text-xs text-mystyle-muted hover:bg-mystyle-stone/40 transition-all"
                >
                  Search a different location
                </button>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
