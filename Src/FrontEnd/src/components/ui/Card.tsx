import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/cn";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export default function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div className={cn("ui-card border border-slate-200 bg-white shadow-sm shadow-slate-950/5 transition-[border-color,box-shadow,background-color] dark:border-ui-border dark:bg-surface-card dark:shadow-dark-card", className)} {...props}>
      {children}
    </div>
  );
}
