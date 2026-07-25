import type { ComponentType, ReactNode } from "react";
import { cn } from "@/utils/cn";

type StatTone = "amber" | "blue" | "brand" | "emerald" | "rose" | "slate";

type StatCardProps = {
  className?: string;
  description?: ReactNode;
  icon: ComponentType<{ className?: string }>;
  label: string;
  tone?: StatTone;
  value: ReactNode;
};

const toneClasses: Record<StatTone, { accent: string; icon: string; text: string }> = {
  amber: {
    accent: "bg-amber-500",
    icon: "bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-900/50",
    text: "text-amber-700 dark:text-amber-400",
  },
  blue: {
    accent: "bg-blue-600",
    icon: "bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:ring-blue-900/50",
    text: "text-blue-700 dark:text-blue-400",
  },
  brand: {
    accent: "bg-brand-700",
    icon: "bg-brand-50 text-brand-700 ring-brand-100 dark:bg-brand-950/30 dark:text-brand-400 dark:ring-brand-900/50",
    text: "text-brand-700 dark:text-brand-400",
  },
  emerald: {
    accent: "bg-emerald-600",
    icon: "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-900/50",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  rose: {
    accent: "bg-rose-600",
    icon: "bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:ring-rose-900/50",
    text: "text-rose-700 dark:text-rose-400",
  },
  slate: {
    accent: "bg-slate-700",
    icon: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-neutral-800 dark:text-gray-300 dark:ring-neutral-700",
    text: "text-slate-600 dark:text-gray-400",
  },
};

export default function StatCard({
  className = "",
  description,
  icon: Icon,
  label,
  tone = "brand",
  value,
}: StatCardProps) {
  const toneClass = toneClasses[tone];

  return (
    <article
      className={cn(
        "group relative min-h-[132px] overflow-hidden rounded-md border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 transition dark:border-[#30283d] dark:bg-[#17131f] dark:shadow-none",
        "hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md hover:shadow-slate-950/10 dark:hover:border-[#4a4058] dark:hover:bg-[#211b2b]",
        className,
      )}
    >
      <div className={cn("absolute inset-x-0 top-0 h-0.5", toneClass.accent)} />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-gray-400">{label}</p>
          <div className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">{value}</div>
        </div>
        <div className={cn("shrink-0 rounded-md p-3 ring-1", toneClass.icon)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {description ? <div className={cn("mt-3 text-sm leading-5", toneClass.text)}>{description}</div> : null}
    </article>
  );
}
