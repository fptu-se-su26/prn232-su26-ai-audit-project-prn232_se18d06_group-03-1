import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

type DashboardHeaderProps = {
  actions?: ReactNode;
  className?: string;
  description: string;
  eyebrow: string;
  title: string;
};

export default function DashboardHeader({
  actions,
  className = "",
  description,
  eyebrow,
  title,
}: DashboardHeaderProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm shadow-slate-950/5 dark:border-[#30283d] dark:bg-[#17131f] dark:shadow-none",
        className,
      )}
    >
      <div className="grid gap-5 p-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700 dark:text-brand-400">{eyebrow}</p>
          <h1 className="mt-2 max-w-full truncate bg-gradient-to-r from-slate-950 via-brand-800 to-fuchsia-700 bg-clip-text text-2xl font-bold tracking-tight text-transparent dark:from-white dark:via-brand-400 dark:to-fuchsia-400 sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700 dark:text-gray-300">{description}</p>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2 md:justify-end">{actions}</div> : null}
      </div>
      <div className="h-1 bg-gradient-to-r from-brand-700 via-blue-600 to-emerald-500" />
    </section>
  );
}
