import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "relative inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "font-sans font-medium tracking-tight",
    "transition-[transform,background-color,border-color,color] duration-200 ease-out",
    "disabled:pointer-events-none disabled:opacity-40",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]",
    "[&_svg]:size-4 [&_svg]:shrink-0",
    "active:translate-y-px",
  ].join(" "),
  {
    variants: {
      variant: {
        // Primary brass — warm gold ink on espresso, hairline brass-bright top edge
        primary: [
          "bg-[var(--brass)] text-[#1A1410]",
          "shadow-[inset_0_1px_0_color-mix(in_oklab,white_25%,transparent),0_1px_2px_rgba(0,0,0,0.4),0_8px_24px_rgba(201,169,97,0.18)]",
          "hover:bg-[var(--brass-bright)] hover:shadow-[inset_0_1px_0_color-mix(in_oklab,white_30%,transparent),0_1px_2px_rgba(0,0,0,0.5),0_12px_32px_rgba(224,190,118,0.22)]",
        ].join(" "),
        // Ghost — text only, warms on hover
        ghost: [
          "bg-transparent text-[var(--ink)]",
          "hover:bg-[var(--surface-2)] hover:text-[var(--ink)]",
        ].join(" "),
        // Outline — espresso surface, hairline border, warm hover
        outline: [
          "bg-[var(--surface)] text-[var(--ink)]",
          "border border-[var(--border-strong)]",
          "hover:bg-[var(--surface-2)] hover:border-[var(--brass-dim)]",
        ].join(" "),
        // Subtle — slightly lifted surface, no border
        subtle: ["bg-[var(--surface-2)] text-[var(--ink)]", "hover:bg-[var(--surface-3)]"].join(
          " ",
        ),
      },
      size: {
        sm: "h-8 rounded-[var(--radius-sm)] px-3 text-[13px]",
        md: "h-10 rounded-[var(--radius-md)] px-5 text-[14px]",
        lg: "h-12 rounded-[var(--radius-md)] px-7 text-[15px]",
        icon: "h-10 w-10 rounded-[var(--radius-md)]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
