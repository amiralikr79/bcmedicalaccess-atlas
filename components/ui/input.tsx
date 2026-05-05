import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "h-10 w-full rounded-[var(--radius-md)] px-4 py-2",
          "bg-[var(--surface-2)] text-[var(--ink)]",
          "border border-[var(--border)]",
          "placeholder:text-[var(--ink-faint)]",
          "font-sans text-[14px]",
          "shadow-[inset_0_1px_0_rgba(0,0,0,0.25)]",
          "transition-[border-color,box-shadow,background-color] duration-200",
          "hover:border-[var(--border-strong)]",
          "focus-visible:border-[var(--brass-dim)] focus-visible:bg-[var(--surface-3)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]/40 focus-visible:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "selection:bg-[var(--brass)]/30 selection:text-[var(--ink)]",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
