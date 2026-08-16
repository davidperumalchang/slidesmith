"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button, Spinner } from "@/components/ui";
import { CheckIcon, XMarkIcon } from "@/components/icons";

export type LookupProgressStatus =
  | "pending"
  | "active"
  | "found"
  | "missing"
  | "error"
  | "skipped";

export type LookupProgressItem = {
  reference: string;
  status: LookupProgressStatus;
  detail?: string;
};

const DONE_STATUSES: LookupProgressStatus[] = ["found", "missing", "error", "skipped"];

function StatusIcon({ status }: { status: LookupProgressStatus }) {
  if (status === "active") return <Spinner className="h-4 w-4 text-brand-600" />;
  if (status === "found") return <CheckIcon className="h-4 w-4 text-emerald-600" />;
  if (status === "missing" || status === "error")
    return <XMarkIcon className="h-4 w-4 text-rose-500" />;
  return <span className="h-1.5 w-1.5 rounded-full bg-slate-300" aria-hidden />;
}

export function LookupProgressModal({
  open,
  items,
  running,
  version,
  onCancel,
  onClose,
}: {
  open: boolean;
  items: LookupProgressItem[];
  running: boolean;
  version: string;
  onCancel: () => void;
  onClose: () => void;
}) {
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
    if (!open || running) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, running, onClose]);

  if (!open || !mounted) return null;

  const completed = items.filter((i) => DONE_STATUSES.includes(i.status)).length;
  const found = items.filter((i) => i.status === "found").length;
  const failed = items.filter((i) => i.status === "missing" || i.status === "error").length;
  const percent = items.length === 0 ? 0 : Math.round((completed / items.length) * 100);

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" aria-hidden />

      <div className="absolute inset-0 flex items-center justify-center overflow-y-auto p-3 sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="lookup-progress-title"
          className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          <div className="shrink-0 border-b border-slate-200 px-5 py-4">
            <h2 id="lookup-progress-title" className="text-lg font-bold text-slate-900">
              {running ? "Looking up passages…" : "Lookup complete"}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {completed} of {items.length} · BibleGateway ({version})
            </p>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-brand-600 transition-all duration-300"
                style={{ width: `${percent}%` }}
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>

          <ul className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto px-5">
            {items.map((item, i) => (
              <li key={`${item.reference}-${i}`} className="flex items-center gap-3 py-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                  <StatusIcon status={item.status} />
                </span>
                <span
                  className={`min-w-0 flex-1 truncate text-sm ${
                    item.status === "pending" ? "text-slate-400" : "text-slate-700"
                  }`}
                >
                  {item.reference}
                </span>
                {item.detail && (
                  <span
                    className={`shrink-0 text-xs ${
                      item.status === "found"
                        ? "text-emerald-600"
                        : item.status === "missing" || item.status === "error"
                          ? "text-rose-600"
                          : "text-slate-400"
                    }`}
                  >
                    {item.detail}
                  </span>
                )}
              </li>
            ))}
          </ul>

          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
            <p className="text-sm text-slate-500">
              {found} found{failed > 0 ? ` · ${failed} failed` : ""}
            </p>
            {running ? (
              <Button variant="secondary" onClick={onCancel}>
                Cancel
              </Button>
            ) : (
              <Button onClick={onClose}>Done</Button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
