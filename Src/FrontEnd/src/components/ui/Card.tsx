import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/cn";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export default function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div className={cn("rounded-md border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5", className)} {...props}>
      {children}
    </div>
  );
}
