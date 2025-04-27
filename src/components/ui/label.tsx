"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Label Component Styles
 *
 * Defines the base styling for the label component
 * Uses Overpass Mono font for consistent typography
 */
const labelVariants = cva(
  [
    "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
    "font-['Overpass_Mono']"
  ]
)

/**
 * Label Component Props
 *
 * Extends Radix UI Label props with:
 * - Additional className handling via cva
 */
interface LabelProps
  extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
    VariantProps<typeof labelVariants> {}

/**
 * Label Component
 *
 * A styled label component using Radix UI Label primitive
 * Used for form inputs with consistent styling
 */
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  LabelProps
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
