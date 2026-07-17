import { cn } from "@/utils/cn";

type StatusTone = "amber" | "blue" | "brand" | "emerald" | "rose" | "slate";

type StatusBadgeProps = {
  children: string;
  className?: string;
  tone?: StatusTone;
};

const toneClasses: Record<StatusTone, string> = {
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  brand: "border-brand-200 bg-brand-50 text-brand-700",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rose: "border-rose-200 bg-rose-50 text-rose-700",
  slate: "border-slate-200 bg-slate-50 text-slate-700",
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
