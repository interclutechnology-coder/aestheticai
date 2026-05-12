"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { SlidersHorizontal, X } from "lucide-react";
import { FiltersPanel } from "./FiltersPanel";
import type { Filters } from "@/types";

interface FiltersDrawerProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export function FiltersDrawer({ filters, onChange }: FiltersDrawerProps) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-mystyle-stone bg-white px-4 py-2 text-sm font-medium text-mystyle-dark shadow-sm transition-all hover:bg-mystyle-cream hover:shadow"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Edit Filters
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-2xl data-[state=open]:animate-slide-up overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-mystyle-stone/60 p-5">
            <Dialog.Title className="text-base font-semibold text-mystyle-dark">
              Adjust Filters
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-lg p-1.5 text-mystyle-muted hover:bg-mystyle-stone/60 hover:text-mystyle-dark transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Filters */}
          <div className="flex-1 p-5">
            <FiltersPanel filters={filters} onChange={onChange} />
          </div>

          {/* Footer */}
          <div className="border-t border-mystyle-stone/60 p-5">
            <Dialog.Close asChild>
              <button
                type="button"
                className="w-full rounded-xl bg-mystyle-dark py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-mystyle-charcoal"
              >
                Apply Filters
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
