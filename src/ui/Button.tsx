import React from "react";
import { cn } from "../lib/format";

type Variant = "primary" | "secondary" | "ghost" | "danger";

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const styles =
    variant === "primary"
      ? "bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
      : variant === "secondary"
        ? "bg-sage-100 text-sage-900 hover:bg-sage-200 dark:bg-slate-700 dark:text-amber-50 dark:hover:bg-slate-600"
        : variant === "danger"
          ? "bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:text-white dark:hover:bg-red-400"
          : "bg-transparent text-slate-700 hover:bg-amber-100 dark:text-slate-100 dark:hover:bg-slate-700";

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition disabled:opacity-50",
        styles,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
