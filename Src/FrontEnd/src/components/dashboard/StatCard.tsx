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
    icon: "bg-amber-50 text-amber-700 ring-amber-100",
    text: "text-amber-700",
  },
  blue: {
    accent: "bg-blue-600",
    icon: "bg-blue-50 text-blue-700 ring-blue-100",
    text: "text-blue-700",
  },
  brand: {
    accent: "bg-brand-700",
    icon: "bg-brand-50 text-brand-700 ring-brand-100",
    text: "text-brand-700",
  },
  emerald: {
    accent: "bg-emerald-600",
    icon: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    text: "text-emerald-700",
  },
  rose: {
    accent: "bg-rose-600",
    icon: "bg-rose-50 text-rose-700 ring-rose-100",
    text: "text-rose-700",
  },
  slate: {
    accent: "bg-slate-700",
    icon: "bg-slate-100 text-slate-700 ring-slate-200",
    text: "text-slate-600",
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
        "group relative min-h-[132px] overflow-hidden rounded-md border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 transition",
        "hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md hover:shadow-slate-950/10",
        className,
      )}
    >
      <div className={cn("absolute inset-x-0 top-0 h-0.5", toneClass.accent)} />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
          <div className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{value}</div>
        </div>
        <div className={cn("shrink-0 rounded-md p-3 ring-1", toneClass.icon)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {description ? <div className={cn("mt-3 text-sm leading-5", toneClass.text)}>{description}</div> : null}
    </article>
  );
}
