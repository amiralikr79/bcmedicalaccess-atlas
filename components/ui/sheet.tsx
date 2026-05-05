"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetPortal = DialogPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50",
      "bg-[#0A0806]/70 backdrop-blur-[2px]",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName;

const sheetVariants = cva(
  [
    "fixed z-50 flex flex-col gap-0",
    "bg-[var(--surface)] text-[var(--ink)]",
    "border-[var(--border-strong)]",
    "shadow-[var(--shadow-lift)]",
    "transition ease-out",
    "data-[state=open]:animate-in data-[state=closed]:animate-out",
  ].join(" "),
  {
    variants: {
      side: {
        // Default: bottom on mobile, right on desktop (≥md)
        responsive: [
          // mobile: bottom
          "inset-x-0 bottom-0 max-h-[86vh] rounded-t-[var(--radius-xl)]",
          "border-t border-x-0",
          "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
          // desktop: right pane
          "md:inset-y-0 md:right-0 md:bottom-auto md:left-auto md:inset-x-auto",
          "md:h-full md:max-h-none md:w-full md:max-w-md md:rounded-none md:rounded-l-[var(--radius-xl)]",
          "md:border-l md:border-t-0",
          "md:data-[state=closed]:slide-out-to-right md:data-[state=open]:slide-in-from-right",
        ].join(" "),
        right: [
          "inset-y-0 right-0 h-full w-full max-w-md",
          "border-l rounded-l-[var(--radius-xl)]",
          "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
        ].join(" "),
        bottom: [
          "inset-x-0 bottom-0 max-h-[86vh] rounded-t-[var(--radius-xl)]",
          "border-t",
          "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        ].join(" "),
      },
    },
    defaultVariants: { side: "responsive" },
  },
);

interface SheetContentProps
  extends
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(({ side, className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      {/* drag handle, mobile only */}
      <div className="flex justify-center pt-3 pb-1 md:hidden">
        <div className="h-1 w-10 rounded-full bg-[var(--border-strong)]" />
      </div>

      <DialogPrimitive.Close
        className={cn(
          "absolute top-4 right-4 z-10",
          "inline-flex size-8 items-center justify-center rounded-[var(--radius-sm)]",
          "text-[var(--ink-muted)] hover:text-[var(--ink)]",
          "hover:bg-[var(--surface-2)]",
          "transition-colors",
          "focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none",
        )}
        aria-label="Close"
      >
        <X className="size-4" />
      </DialogPrimitive.Close>

      {children}
    </DialogPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = "SheetContent";

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col gap-1 px-6 pt-6 pb-4", className)} {...props} />
);
SheetHeader.displayName = "SheetHeader";

const SheetBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex-1 overflow-y-auto px-6 pb-6", className)} {...props} />
);
SheetBody.displayName = "SheetBody";

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse gap-2 px-6 py-4 sm:flex-row sm:justify-end",
      "border-t border-[var(--border)]",
      className,
    )}
    {...props}
  />
);
SheetFooter.displayName = "SheetFooter";

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "font-display text-2xl leading-tight tracking-tight text-[var(--ink)]",
      className,
    )}
    {...props}
  />
));
SheetTitle.displayName = DialogPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-[var(--ink-muted)]", className)}
    {...props}
  />
));
SheetDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetBody,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
