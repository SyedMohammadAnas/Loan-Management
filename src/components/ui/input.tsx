"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Input Component
 *
 * A customizable input component using Overpass Mono font
 * Follows shadcn UI conventions
 */
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

/**
 * Input Component
 *
 * Renders an input field with consistent styling
 * Uses Overpass Mono font for consistent typography
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "font-['Overpass_Mono']",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
