import type { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

type ProgressProps = HTMLAttributes<HTMLDivElement> & {
  value: number;
  label?: string;
};

export default function Progress({ className, value, label, ...props }: ProgressProps) {
  const normalized = Math.min(100, Math.max(0, value));

  return (
    <div
      aria-label={label}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={normalized}
      className={cn("h-2 overflow-hidden rounded-full bg-slate-200 shadow-inner dark:bg-surface-hover", className)}
      role="progressbar"
      {...props}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-brand-600 to-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.35)] transition-[width] duration-slow ease-standard"
        style={{ width: `${normalized}%` }}
      />
    </div>
  );
}
