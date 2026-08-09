"use client";

import { forwardRef, useEffect, useId, useRef, useState } from "react";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";
import { SlidesIcon, ProjectorIcon, ChevronDownIcon, CheckIcon } from "./icons";

export type OutputFormat = "ppt" | "pp7";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
};

export function Button({
  variant = "primary",
  loading = false,
  disabled,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const styles: Record<string, string> = {
    primary:
      "bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-300 shadow-sm shadow-brand-600/30",
    secondary:
      "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus-visible:ring-slate-300",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-300",
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------
export function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------
export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`card p-6 ${className}`}>{children}</div>;
}

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className = "", ...rest }, ref) {
    return <textarea ref={ref} className={`input-base font-mono leading-relaxed ${className}`} {...rest} />;
  },
);

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = "", ...rest }, ref) {
    return <input ref={ref} className={`input-base ${className}`} {...rest} />;
  },
);

/**
 * Custom dropdown matching the app's select style:
 * light trigger, brand focus ring when open, dark glass menu with a check on
 * the selected option.
 */
export function Select({
  value,
  onChange,
  options,
  placeholder = "Select…",
  disabled = false,
  className = "",
  id,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const moveSelection = (dir: 1 | -1) => {
    const enabled = options.filter((o) => !o.disabled);
    if (enabled.length === 0) return;
    const idx = Math.max(
      0,
      enabled.findIndex((o) => o.value === value),
    );
    const next = enabled[(idx + dir + enabled.length) % enabled.length];
    onChange(next.value);
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            if (!open) setOpen(true);
            else moveSelection(1);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (!open) setOpen(true);
            else moveSelection(-1);
          } else if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
        className={`input-base flex items-center justify-between gap-2 pr-3 text-left ${
          open
            ? "border-brand-500 ring-2 ring-brand-200"
            : ""
        } ${!selected ? "text-slate-400" : ""}`}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? "rotate-180 text-brand-600" : ""}`}
        />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-activedescendant={selected ? `${listId}-${selected.value}` : undefined}
          className="absolute left-0 right-0 z-40 mt-1.5 max-h-60 overflow-auto rounded-2xl border border-white/10 bg-slate-800/90 p-1.5 shadow-xl shadow-slate-900/30 backdrop-blur-xl"
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <li key={opt.value} role="option" aria-selected={isSelected} id={`${listId}-${opt.value}`}>
                <button
                  type="button"
                  disabled={opt.disabled}
                  onClick={() => {
                    if (opt.disabled) return;
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                    opt.disabled
                      ? "cursor-not-allowed text-white/30"
                      : isSelected
                        ? "bg-white/15 font-medium text-white"
                        : "text-white/90 hover:bg-white/10"
                  }`}
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                    {isSelected && <CheckIcon className="h-3.5 w-3.5 text-white" />}
                  </span>
                  <span className="truncate">{opt.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label-base">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toggle (segmented) for template selection
// ---------------------------------------------------------------------------
export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; description?: string }[];
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-xl border px-4 py-3 text-left transition ${
              active
                ? "border-brand-500 bg-brand-50 ring-1 ring-brand-300"
                : "border-slate-300 bg-white hover:border-slate-400"
            }`}
          >
            <span className={`block text-sm font-semibold ${active ? "text-brand-700" : "text-slate-700"}`}>
              {opt.label}
            </span>
            {opt.description && (
              <span className="mt-0.5 block text-xs text-slate-500">{opt.description}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Alert
// ---------------------------------------------------------------------------
export function Alert({
  variant = "info",
  children,
}: {
  variant?: "info" | "success" | "error" | "warning";
  children: ReactNode;
}) {
  const styles: Record<string, string> = {
    info: "bg-brand-50 text-brand-800 border-brand-200",
    success: "bg-emerald-50 text-emerald-800 border-emerald-200",
    error: "bg-rose-50 text-rose-800 border-rose-200",
    warning: "bg-amber-50 text-amber-900 border-amber-200",
  };
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${styles[variant]}`} role="status">
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page header
// ---------------------------------------------------------------------------
export function PageHeader({
  icon,
  title,
  description,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-8 flex items-start gap-4">
      {icon && (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-600/30">
          {icon}
        </span>
      )}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step badge
// ---------------------------------------------------------------------------
export function StepBadge({ n, title, done }: { n: number; title: string; done?: boolean }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${
          done ? "bg-emerald-500 text-white" : "bg-brand-600 text-white"
        }`}
      >
        {n}
      </span>
      <h2 className="text-base font-semibold text-slate-800">{title}</h2>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Output format toggle (PowerPoint vs ProPresenter 7)
// ---------------------------------------------------------------------------
export function OutputFormatToggle({
  value,
  onChange,
}: {
  value: OutputFormat;
  onChange: (v: OutputFormat) => void;
}) {
  const options = [
    {
      value: "ppt" as const,
      label: "PowerPoint",
      sub: ".pptx",
      desc: "Editable slides — PowerPoint, Keynote, Google Slides",
      Icon: SlidesIcon,
    },
    {
      value: "pp7" as const,
      label: "ProPresenter 7",
      sub: ".pro",
      desc: "Native ProPresenter 7 file",
      Icon: ProjectorIcon,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((opt) => {
        const active = value === opt.value;
        const Icon = opt.Icon;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
              active
                ? "border-brand-500 bg-brand-50 ring-1 ring-brand-300"
                : "border-slate-300 bg-white hover:border-slate-400"
            }`}
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                active ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500"
              }`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span>
              <span className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${active ? "text-brand-700" : "text-slate-800"}`}>
                  {opt.label}
                </span>
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                  {opt.sub}
                </span>
              </span>
              <span className="mt-0.5 block text-xs text-slate-500">{opt.desc}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
