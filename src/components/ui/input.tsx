import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-brand)] disabled:opacity-60",
          className
        )}
        {...props}
      />
    );
  }
);

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-brand)] disabled:opacity-60",
          className
        )}
        {...props}
      />
    );
  }
);

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(
          "w-full appearance-none rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-2.5 text-sm text-white outline-none focus:border-[color:var(--color-brand)] disabled:opacity-60",
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);

export function FormField({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1 text-xs uppercase tracking-wider text-[color:var(--color-muted)]">
        {label}
        {required ? <span className="text-[color:var(--color-danger)]">*</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-[color:var(--color-muted)]">{hint}</span> : null}
    </label>
  );
}

export function FormMessage({
  kind,
  children,
}: {
  kind: "ok" | "err";
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        kind === "ok"
          ? "rounded-md border border-[color:var(--color-brand)]/40 bg-[color:var(--color-brand-soft)] px-3 py-2 text-sm text-[color:var(--color-brand)]"
          : "rounded-md border border-[color:var(--color-danger)]/40 bg-[color:var(--color-danger)]/10 px-3 py-2 text-sm text-[color:var(--color-danger)]"
      }
    >
      {children}
    </div>
  );
}
