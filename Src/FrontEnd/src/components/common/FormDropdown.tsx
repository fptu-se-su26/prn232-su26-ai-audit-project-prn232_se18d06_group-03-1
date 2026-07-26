import { ChevronDown } from "lucide-react";
import { useRef, useState } from "react";
import useClickOutside from "@/hooks/useClickOutside";
import { cn } from "@/utils/cn";

type FormDropdownOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type FormDropdownProps = {
  value: string;
  options: FormDropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
};

export default function FormDropdown({
  value,
  options,
  onChange,
  placeholder = "Chọn",
  disabled = false,
  className,
  triggerClassName,
}: FormDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((option) => option.value === value);

  useClickOutside(ref, () => setOpen(false));

  return (
    <div className={cn("relative mt-1", className)} ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "ui-control flex min-h-11 w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm leading-normal outline-none hover:border-ui-border-strong hover:bg-surface-hover focus:border-primary focus:ring-4 focus:ring-primary-subtle disabled:cursor-not-allowed disabled:opacity-50",
          triggerClassName,
        )}
      >
        <span className={current ? "truncate" : "truncate text-slate-400"}>{current?.label ?? placeholder}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && !disabled && (
        <div className="dropdown-scrollbar absolute left-0 top-full z-50 mt-1 max-h-72 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-xl shadow-slate-950/10">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={option.disabled}
              onClick={() => {
                if (option.disabled) return;
                onChange(option.value);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center px-3 py-1.5 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:text-slate-400",
                option.value === value ? "bg-brand-100 font-medium text-brand-700" : "text-slate-700 hover:bg-brand-50 hover:text-brand-700",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
