import { cn } from "@/utils/cn";

type StatusTone = "amber" | "blue" | "brand" | "emerald" | "rose" | "slate";

type StatusBadgeProps = {
  children: string;
  className?: string;
  tone?: StatusTone;
};

const toneClasses: Record<StatusTone, string> = {
  amber: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400",
  blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-400",
  brand: "border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-900/50 dark:bg-brand-950/30 dark:text-brand-400",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400",
  rose: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400",
  slate: "border-slate-200 bg-slate-50 text-slate-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-300",
};

export default function StatusBadge({ children, className = "", tone = "slate" }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
