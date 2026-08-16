"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button, Spinner } from "@/components/ui";
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@/components/icons";

export type SlideRailItem = {
  label: string;
  previewText: string;
  thumbnail?: ReactNode;
};

export function SlidePreviewShell({
  open,
  onClose,
  loading,
  error,
  titleId,
  subtitle,
  index,
  onIndexChange,
  total,
  items,
  badge,
  children,
}: {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  titleId: string;
  subtitle: string | null;
  index: number;
  onIndexChange: (index: number) => void;
  total: number;
  items: SlideRailItem[];
  badge?: ReactNode;
  children: ReactNode;
}) {
  const activeRef = useRef<HTMLButtonElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [open, index]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (total <= 0) return;
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        onIndexChange(Math.max(0, index - 1));
      }
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        onIndexChange(Math.min(total - 1, index + 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, onIndexChange, index, total]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      {/* Full-viewport scrim — click closes */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        onMouseDown={onClose}
        aria-hidden
      />

      <div
        className="absolute inset-0 flex items-center justify-center overflow-y-auto p-3 sm:p-6"
        onMouseDown={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
            <div>
              <h2 id={titleId} className="text-lg font-bold text-slate-900">
                Slide preview
              </h2>
              {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {loading && (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-slate-500">
                <Spinner className="h-8 w-8 text-brand-600" />
                <p className="text-sm">Building preview…</p>
              </div>
            )}

            {!loading && error && (
              <div className="p-5">
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  {error}
                </div>
              </div>
            )}

            {!loading && !error && total > 0 && (
              <div className="flex min-h-0 flex-1">
                {/* PowerPoint-style slide sorter */}
                <aside className="flex w-[8.5rem] shrink-0 flex-col border-r border-slate-200 bg-slate-50 sm:w-52">
                  <div className="shrink-0 border-b border-slate-200 px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Slides
                    </p>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
                    <ul className="space-y-2">
                      {items.map((item, i) => {
                        const active = i === index;
                        return (
                          <li key={i}>
                            <button
                              type="button"
                              ref={active ? activeRef : undefined}
                              onClick={() => onIndexChange(i)}
                              aria-current={active ? "true" : undefined}
                              aria-label={`Slide ${i + 1}: ${item.label}`}
                              className={`group flex w-full gap-2 rounded-lg p-1.5 text-left transition ${
                                active ? "bg-brand-50" : "hover:bg-white"
                              }`}
                            >
                              <span
                                className={`w-5 shrink-0 pt-0.5 text-right text-[11px] font-semibold tabular-nums ${
                                  active ? "text-brand-700" : "text-slate-400"
                                }`}
                              >
                                {i + 1}
                              </span>
                              <span className="min-w-0 flex-1">
                              <span
                                className={`relative block aspect-video w-full overflow-hidden rounded border bg-black shadow-sm ${
                                  active
                                    ? "border-brand-500 ring-2 ring-brand-500/30"
                                    : "border-slate-300 group-hover:border-slate-400"
                                }`}
                              >
                                {item.thumbnail ? (
                                  <span className="pointer-events-none absolute inset-0 block">
                                    {item.thumbnail}
                                  </span>
                                ) : (
                                  <span className="flex h-full flex-col items-center justify-center gap-0.5 px-1.5 py-1">
                                    <span className="line-clamp-3 w-full whitespace-pre-line text-center text-[8px] font-medium leading-tight text-white sm:text-[9px]">
                                      {item.previewText || " "}
                                    </span>
                                  </span>
                                )}
                              </span>
                                <span
                                  className={`mt-1 block truncate text-[10px] font-medium sm:text-[11px] ${
                                    active ? "text-brand-700" : "text-slate-500"
                                  }`}
                                >
                                  {item.label}
                                </span>
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </aside>

                {/* Main canvas */}
                <div className="flex min-w-0 flex-1 flex-col overflow-y-auto px-4 py-4 sm:px-5">
                  <div className="mx-auto w-full max-w-3xl">{children}</div>

                  <div className="mx-auto mt-4 flex w-full max-w-3xl items-center justify-between gap-3">
                    <Button
                      variant="secondary"
                      onClick={() => onIndexChange(Math.max(0, index - 1))}
                      disabled={index === 0}
                      className="!px-3"
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                      Prev
                    </Button>
                    <p className="text-center text-sm font-medium text-slate-600">
                      Slide {index + 1} of {total}
                      {badge}
                    </p>
                    <Button
                      variant="secondary"
                      onClick={() => onIndexChange(Math.min(total - 1, index + 1))}
                      disabled={index >= total - 1}
                      className="!px-3"
                    >
                      Next
                      <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
