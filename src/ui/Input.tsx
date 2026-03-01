import React from "react";
import { cn } from "../lib/format";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900/40 dark:bg-slate-950 dark:border-slate-800",
        props.className
      )}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900/40 dark:bg-slate-950 dark:border-slate-800",
        props.className
      )}
    />
  );
}
