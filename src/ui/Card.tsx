import React from "react";
import { cn } from "../lib/format";

export function Card({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-amber-200 bg-white/90 p-5 shadow-soft transition hover:-translate-y-[1px] hover:border-amber-300 hover:shadow-warm dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-100 dark:hover:border-slate-600",
        className
      )}
    >
      {children}
    </div>
  );
}
