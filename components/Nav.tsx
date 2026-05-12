"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Bookmark, Home, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOutfitStore } from "@/store/outfitStore";

export function Nav() {
  const pathname = usePathname();
  const { outfits } = useOutfitStore();
  const hasResults = outfits.length > 0;

  const links = [
    { href: "/", label: "Home", icon: Home },
    {
      href: "/results",
      label: "Results",
      icon: TrendingUp,
      disabled: !hasResults,
    },
    { href: "/saved", label: "Saved", icon: Bookmark },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-mystyle-stone/60 bg-mystyle-cream/90 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-mystyle-dark hover:opacity-80 transition-opacity"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-mystyle-dark">
            <Sparkles className="h-3.5 w-3.5 text-mystyle-cream" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">
            MyStyle<span className="text-mystyle-accent">.ai</span>
          </span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon, disabled }) => (
            <Link
              key={href}
              href={disabled ? "#" : href}
              aria-disabled={disabled}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                disabled
                  ? "cursor-not-allowed text-mystyle-muted/50"
                  : pathname === href
                  ? "bg-mystyle-dark text-mystyle-cream"
                  : "text-mystyle-charcoal hover:bg-mystyle-stone/60"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </div>

        {/* Demo Mode badge */}
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1 rounded-full border border-mystyle-warm/40 bg-mystyle-warm/10 px-2.5 py-0.5 text-xs font-medium text-mystyle-accent sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-mystyle-accent animate-pulse" />
            Demo Mode
          </span>
        </div>
      </nav>
    </header>
  );
}
