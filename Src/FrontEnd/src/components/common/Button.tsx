import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-zinc-900 text-white hover:bg-zinc-800 disabled:bg-zinc-400",
  secondary: "border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 disabled:text-zinc-400",
  ghost: "text-zinc-700 hover:bg-zinc-100 disabled:text-zinc-400",
};

export default function Button({ children, className = "", variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={[
        "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed",
        variantClasses[variant],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
