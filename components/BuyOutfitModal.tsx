"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, ExternalLink, Copy, Check, ShoppingBag, Mail } from "lucide-react";
import { toast } from "sonner";
import type { Outfit } from "@/types";
import { formatPrice } from "@/lib/utils";
import { addToWaitlist } from "@/lib/storage";
import { getRetailerSearchUrl } from "@/lib/retailerLinks";

interface BuyOutfitModalProps {
  outfit: Outfit;
  open: boolean;
  onClose: () => void;
}

export function BuyOutfitModal({ outfit, open, onClose }: BuyOutfitModalProps) {
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [joined, setJoined] = useState(false);

  const itemEntries = Object.entries(outfit.items).filter(([, v]) => v != null) as [
    string,
    NonNullable<(typeof outfit.items)[keyof typeof outfit.items]>
  ][];

  const categoryLabels: Record<string, string> = {
    top: "Top", bottom: "Bottom", shoes: "Shoes",
    outerwear: "Outerwear", accessory: "Accessory",
  };

  const handleCopyAll = async () => {
    const urls = itemEntries.map(([, p]) => `${p.name} (${p.retailer}) — ${getRetailerSearchUrl(p.retailer, p.name)}`).join("\n");
    await navigator.clipboard.writeText(urls);
    setCopied(true);
    toast.success("All links copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleJoinWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    const added = addToWaitlist(email);
    if (added) {
      setJoined(true);
      toast.success("You're on the list! We'll be in touch.", {
        description: "One-click checkout coming soon.",
      });
    } else {
      toast.info("You're already on the waitlist!");
    }
    setEmail("");
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl data-[state=open]:animate-fade-in overflow-hidden max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-mystyle-stone/60 p-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-mystyle-dark">
                <ShoppingBag className="h-4.5 w-4.5 text-white h-[18px] w-[18px]" />
              </div>
              <div>
                <Dialog.Title className="text-base font-semibold text-mystyle-dark">
                  Buy Entire Outfit
                  <span className="ml-2 rounded-full bg-mystyle-warm/20 px-2 py-0.5 text-[10px] font-bold text-mystyle-accent">
                    COMING SOON
                  </span>
                </Dialog.Title>
                <p className="text-xs text-mystyle-muted">{formatPrice(outfit.totalPrice)} total</p>
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-lg p-1.5 text-mystyle-muted hover:bg-mystyle-stone/60 hover:text-mystyle-dark transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="overflow-y-auto flex-1">
            {/* Hero message */}
            <div className="bg-gradient-to-br from-mystyle-cream to-mystyle-stone/30 p-5 border-b border-mystyle-stone/40">
              <p className="text-sm text-mystyle-charcoal leading-relaxed">
                We&apos;re building <strong>one-click checkout across retailers</strong> — buy your entire outfit without switching tabs. For now, open each item below individually.
              </p>
            </div>

            {/* Item list */}
            <div className="divide-y divide-mystyle-stone/40">
              {itemEntries.map(([category, product]) => (
                <div key={category} className="flex items-center justify-between p-4 gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-mystyle-muted">
                      {categoryLabels[category] || category}
                    </p>
                    <p className="text-sm font-medium text-mystyle-dark truncate">{product.name}</p>
                    <p className="text-xs text-mystyle-muted">{product.retailer} · {formatPrice(product.price)}</p>
                  </div>
                  <a
                    href={getRetailerSearchUrl(product.retailer, product.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-mystyle-stone bg-white px-3 py-1.5 text-xs font-semibold text-mystyle-dark transition-all hover:bg-mystyle-stone/50 hover:shadow-sm"
                  >
                    Open <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ))}
            </div>

            {/* Copy all */}
            <div className="p-5 border-t border-mystyle-stone/40">
              <button
                type="button"
                onClick={handleCopyAll}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-mystyle-stone bg-mystyle-cream/60 py-2.5 text-sm font-medium text-mystyle-dark transition-all hover:bg-mystyle-stone/40"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy all links
                  </>
                )}
              </button>
            </div>

            {/* Waitlist */}
            <div className="bg-mystyle-dark p-5 m-4 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-4 w-4 text-mystyle-warm" />
                <p className="text-sm font-semibold text-white">
                  Get early access to one-click checkout
                </p>
              </div>
              <p className="text-xs text-mystyle-stone mb-3">
                Be first when we launch seamless multi-retailer checkout.
              </p>
              {joined ? (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30 p-3">
                  <Check className="h-4 w-4 text-emerald-400" />
                  <p className="text-sm text-emerald-300 font-medium">You&apos;re on the list!</p>
                </div>
              ) : (
                <form onSubmit={handleJoinWaitlist} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="flex-1 rounded-xl border-0 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-mystyle-muted focus:outline-none focus:ring-2 focus:ring-mystyle-warm/50"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-mystyle-warm px-4 py-2 text-sm font-semibold text-mystyle-dark transition-all hover:bg-mystyle-gold"
                  >
                    Join
                  </button>
                </form>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
