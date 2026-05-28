import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "success" | "warning" | "danger" | "info" | "outline";

const styles: Record<Variant, string> = {
  default: "bg-[color:var(--color-surface-2)] text-[color:var(--color-text)]",
  success: "bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand)] border border-[color:var(--color-brand)]/30",
  warning: "bg-[color:var(--color-warning)]/15 text-[color:var(--color-warning)] border border-[color:var(--color-warning)]/30",
  danger: "bg-[color:var(--color-danger)]/15 text-[color:var(--color-danger)] border border-[color:var(--color-danger)]/30",
  info: "bg-[color:var(--color-info)]/15 text-[color:var(--color-info)] border border-[color:var(--color-info)]/30",
  outline: "border border-[color:var(--color-border)] text-[color:var(--color-text)]",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        styles[variant],
        className
      )}
      {...props}
    />
  );
}
