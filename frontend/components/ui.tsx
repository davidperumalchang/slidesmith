"use client";

import { forwardRef } from "react";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

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

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className = "", children, ...rest }, ref) {
    return (
      <select ref={ref} className={`input-base pr-9 ${className}`} {...rest}>
        {children}
      </select>
    );
  },
);

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
