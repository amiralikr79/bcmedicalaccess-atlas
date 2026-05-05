import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  [
    "inline-flex items-center gap-1.5 whitespace-nowrap",
    "font-sans text-[11px] uppercase tracking-[0.08em]",
    "rounded-full border px-2.5 py-1",
    "transition-colors duration-200",
  ].join(" "),
  {
    variants: {
      variant: {
        // Quiet, mostly text — bordered hairline
        default: [
          "bg-[var(--surface-2)]/60 backdrop-blur-sm",
          "border-[var(--border-strong)]",
          "text-[var(--ink-muted)]",
        ].join(" "),
        // Brass accent — warm fill
        accent: [
          "bg-[color-mix(in_oklab,var(--brass)_20%,transparent)]",
          "border-[color-mix(in_oklab,var(--brass)_50%,transparent)]",
          "text-[var(--brass-bright)]",
        ].join(" "),
        // Ghost outline only
        outline: ["bg-transparent", "border-[var(--border-strong)]", "text-[var(--ink)]"].join(" "),
        // Segment — color injected via inline style (use the `accentColor` prop pattern)
        segment: [
          "bg-[color-mix(in_oklab,var(--seg)_18%,transparent)]",
          "border-[color-mix(in_oklab,var(--seg)_45%,transparent)]",
          "text-[var(--seg)]",
        ].join(" "),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  /** When using variant="segment", pass the segment color (hex or var(--seg-*)). */
  accentColor?: string;
}

function Badge({ className, variant, accentColor, style, ...props }: BadgeProps) {
  const mergedStyle =
    accentColor !== undefined ? { ...style, ["--seg" as string]: accentColor } : style;
  return (
    <span className={cn(badgeVariants({ variant }), className)} style={mergedStyle} {...props} />
  );
}

export { Badge, badgeVariants };
