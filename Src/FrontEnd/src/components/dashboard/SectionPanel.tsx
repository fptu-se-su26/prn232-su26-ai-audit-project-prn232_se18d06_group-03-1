import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

type SectionPanelProps = {
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  description?: string;
  title: string;
};

export default function SectionPanel({
  action,
  children,
  className = "",
  contentClassName = "",
  description,
  title,
}: SectionPanelProps) {
  return (
    <section
      className={cn(
        "min-w-0 overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm shadow-slate-950/5",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-slate-950">{title}</h2>
          {description ? <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={cn("p-5", contentClassName)}>{children}</div>
    </section>
  );
}
