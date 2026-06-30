import type { HTMLAttributes } from "react";

type LoadingSpinnerProps = HTMLAttributes<HTMLSpanElement>;

export default function LoadingSpinner({ className = "h-5 w-5", ...props }: LoadingSpinnerProps) {
  return (
    <span
      aria-hidden="true"
      className={[
        "inline-block animate-spin rounded-full border-2 border-current border-r-transparent text-violet-300",
        className,
      ].join(" ")}
      {...props}
    />
  );
}
