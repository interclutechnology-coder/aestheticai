"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, MapPin, Navigation, Store, Clock, AlertCircle } from "lucide-react";

interface StoreLocatorProps {
  open: boolean;
  onClose: () => void;
  retailers: string[];
}

interface MockStore {
  name: string;
  address: string;
  neighborhood: string;
  distance: string;
  hours: string;
  retailer: string;
  inStock: boolean;
}

const MOCK_STORES: Record<string, MockStore[]> = {
  Zara: [
    { name: "Zara", address: "123 Main St", neighborhood: "Downtown", distance: "0.8 mi", hours: "10am–9pm", retailer: "Zara", inStock: true },
    { name: "Zara", address: "456 Mall Blvd", neighborhood: "Westfield Mall", distance: "2.3 mi", hours: "10am–9pm", retailer: "Zara", inStock: true },
  ],
  Uniqlo: [
    { name: "Uniqlo", address: "789 Fashion Ave", neighborhood: "City Center", distance: "1.1 mi", hours: "10am–8pm", retailer: "Uniqlo", inStock: true },
    { name: "Uniqlo", address: "321 Park St", neighborhood: "Uptown", distance: "3.0 mi", hours: "10am–8pm", retailer: "Uniqlo", inStock: false },
  ],
  Nike: [
    { name: "Nike Factory Store", address: "555 Sport Blvd", neighborhood: "East Side", distance: "1.5 mi", hours: "9am–9pm", retailer: "Nike", inStock: true },
    { name: "Nike Store", address: "222 Athletic Dr", neighborhood: "Midtown", distance: "2.8 mi", hours: "9am–9pm", retailer: "Nike", inStock: true },
  ],
  "H&M": [
    { name: "H&M", address: "100 High St", neighborhood: "Downtown", distance: "0.5 mi", hours: "9am–8pm", retailer: "H&M", inStock: true },
    { name: "H&M", address: "400 Shopping Lane", neighborhood: "West Mall", distance: "4.2 mi", hours: "10am–9pm", retailer: "H&M", inStock: false },
  ],
  "Free People": [
    { name: "Free People", address: "707 Boho Ave", neighborhood: "Arts District", distance: "2.1 mi", hours: "11am–7pm", retailer: "Free People", inStock: true },
  ],
  Abercrombie: [
    { name: "Abercrombie & Fitch", address: "808 Prep St", neighborhood: "Galleria", distance: "3.5 mi", hours: "10am–9pm", retailer: "Abercrombie", inStock: true },
  ],
  "Levi's": [
    { name: "Levi's Store", address: "909 Denim Dr", neighborhood: "Union Square", distance: "1.8 mi", hours: "10am–8pm", retailer: "Levi's", inStock: true },
  ],
  "Banana Republic": [
    { name: "Banana Republic", address: "600 Business Blvd", neighborhood: "Financial District", distance: "0.9 mi", hours: "9am–7pm", retailer: "Banana Republic", inStock: true },
  ],
  ASOS: [],
};

function getStoresForRetailers(retailers: string[]): MockStore[] {
  const results: MockStore[] = [];
  for (const retailer of retailers) {
    const key = Object.keys(MOCK_STORES).find(
      (k) =>
        retailer.toLowerCase().includes(k.toLowerCase()) ||
        k.toLowerCase().includes(retailer.toLowerCase())
    );
    if (key) results.push(...MOCK_STORES[key]);
  }
  return results;
}

export function StoreLocator({ open, onClose, retailers }: StoreLocatorProps) {
  const [zipCode, setZipCode] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationLabel, setLocationLabel] = useState("");

  const relevantStores = getStoresForRetailers(retailers);
  const onlineOnlyRetailers = retailers.filter((r) => {
    const key = Object.keys(MOCK_STORES).find(
      (k) => r.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(r.toLowerCase())
    );
    return key && MOCK_STORES[key].length === 0;
  });

  const handleLocate = () => {
    setLocating(true);
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationLabel("your current location");
          setSubmitted(true);
          setLocating(false);
        },
        () => {
          setLocationLabel("nearby");
          setSubmitted(true);
          setLocating(false);
        }
      );
    } else {
      setLocationLabel("nearby");
      setSubmitted(true);
      setLocating(false);
    }
  };

  const handleZipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (zipCode.trim().length >= 3) {
      setLocationLabel(`near ${zipCode.trim()}`);
      setSubmitted(true);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setZipCode("");
    setLocationLabel("");
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
              <button
                type="button"
                className="rounded-lg p-1.5 text-mystyle-muted hover:bg-mystyle-stone/60 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="p-5">
            {!submitted ? (
              <div className="space-y-4">
                <p className="text-sm text-mystyle-muted">
                  Find physical stores near you carrying items from this outfit.
                  Checking: <span className="font-medium text-mystyle-dark">{retailers.join(", ")}</span>
                </p>

                <button
                  type="button"
                  onClick={handleLocate}
                  disabled={locating}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-mystyle-dark py-3 text-sm font-semibold text-white hover:bg-mystyle-charcoal disabled:opacity-50 transition-all"
                >
                  <Navigation className="h-4 w-4" />
                  {locating ? "Detecting location…" : "Use My Current Location"}
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-mystyle-stone" />
                  <span className="text-xs text-mystyle-muted">or enter zip code</span>
                  <div className="flex-1 border-t border-mystyle-stone" />
                </div>

                <form onSubmit={handleZipSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="e.g. 10001"
                    maxLength={10}
                    className="flex-1 rounded-xl border border-mystyle-stone bg-mystyle-cream/40 px-4 py-2.5 text-sm text-mystyle-dark placeholder:text-mystyle-muted/60 focus:outline-none focus:ring-2 focus:ring-mystyle-accent/50"
                  />
                  <button
                    type="submit"
                    className="rounded-xl border border-mystyle-stone bg-white px-4 py-2.5 text-sm font-medium text-mystyle-dark hover:bg-mystyle-stone/40 transition-all"
                  >
                    Search
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm font-medium text-mystyle-dark">
                  Stores {locationLabel}:
                </p>

                {onlineOnlyRetailers.length > 0 && (
                  <div className="flex items-start gap-2 rounded-xl border border-mystyle-stone/60 bg-mystyle-cream/40 p-3 text-xs text-mystyle-muted">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                    <span>
                      <span className="font-medium">{onlineOnlyRetailers.join(", ")}</span>
                      {" "}is online-only — visit their website to shop.
                    </span>
                  </div>
                )}

                {relevantStores.length === 0 ? (
                  <div className="py-8 text-center text-sm text-mystyle-muted">
                    <Store className="mx-auto mb-2 h-8 w-8 opacity-30" />
                    <p>All retailers for this outfit are online-only.</p>
                    <p className="mt-1 text-xs">Visit their websites to check availability.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {relevantStores.map((store, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 rounded-xl border border-mystyle-stone bg-mystyle-cream/30 p-3"
                      >
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-mystyle-dark text-white text-xs font-bold">
                          {store.retailer.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-mystyle-dark">{store.name}</p>
                            {store.inStock ? (
                              <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">
                                In stock
                              </span>
                            ) : (
                              <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">
                                Check in-store
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-mystyle-muted">{store.address}, {store.neighborhood}</p>
                          <div className="mt-1.5 flex items-center gap-3">
                            <span className="text-[11px] font-semibold text-mystyle-accent">{store.distance}</span>
                            <span className="flex items-center gap-1 text-[11px] text-mystyle-muted">
                              <Clock className="h-3 w-3" />
                              {store.hours}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-center text-[10px] text-mystyle-muted/60">
                  Live inventory check coming soon · Distances are estimated based on your area
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
