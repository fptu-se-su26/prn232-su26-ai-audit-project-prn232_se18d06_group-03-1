import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export default function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div className={["rounded-lg border border-zinc-200 bg-white p-5 shadow-sm", className].join(" ")} {...props}>
      {children}
    </div>
  );
}
