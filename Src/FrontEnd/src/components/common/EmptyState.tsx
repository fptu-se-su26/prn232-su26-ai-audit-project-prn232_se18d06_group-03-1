import type { ReactNode } from "react";

type EmptyStateProps = {
  action?: ReactNode;
  description?: string;
  title: string;
};

export default function EmptyState({ action, description, title }: EmptyStateProps) {
  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-white px-6 py-10 text-center shadow-sm shadow-slate-950/5 dark:border-[#3b3348] dark:bg-[#17131f] dark:shadow-none">
      <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{title}</h2>
      {description ? <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-gray-300">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
