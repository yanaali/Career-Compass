import React from "react";
import { cn } from "../lib/format";

export function Card({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("rounded-2xl border bg-white dark:bg-slate-950 dark:border-slate-800 p-5 shadow-soft transition hover:shadow-lg hover:-translate-y-[1px]", className)}>{children}</div>;
}
