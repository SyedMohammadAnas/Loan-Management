"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Gradient Button Component
 *
 * A customizable button component with gradient styling options
 * Provides two variants:
 * - default: Standard gradient button
 * - variant: Alternative gradient styling
 */
const gradientButtonVariants = cva(
  [
    "gradient-button",
    "inline-flex items-center justify-center",
    "rounded-[11px] min-w-[132px] px-9 py-4",
    "text-base leading-[19px] font-[500] text-white",
    "font-['Overpass_Mono'] font-bold",
    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
    "disabled:pointer-events-none disabled:opacity-50",
  ],
  {
    variants: {
      variant: {
        default: "",
        variant: "gradient-button-variant",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/**
 * GradientButton Props Interface
 *
 * Extends standard button HTML attributes with:
 * - variant: Controls the visual style variant
 * - asChild: When true, renders the component as a Slot
 */
export interface GradientButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof gradientButtonVariants> {
  asChild?: boolean
}

/**
 * GradientButton Component
 *
 * A stylized button component with gradient backgrounds
 * Can be used as a regular button or can adopt the props and behavior
 * of its child when asChild is true
 */
const GradientButton = React.forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, variant, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(gradientButtonVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
GradientButton.displayName = "GradientButton"

export { GradientButton, gradientButtonVariants }
