import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export default function Input({ className = "", label, id, ...props }: InputProps) {
  const inputId = id ?? props.name;

  return (
    <label className="grid gap-1.5 text-sm font-medium text-zinc-700" htmlFor={inputId}>
      {label ? <span>{label}</span> : null}
      <input
        id={inputId}
        className={[
          "h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition-colors",
          "placeholder:text-zinc-400 focus:border-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-100",
          className,
        ].join(" ")}
        {...props}
      />
    </label>
  );
}
