"use client"

import { GradientButton } from "@/components/ui/gradient-button"
import { HeroGeometric } from "@/components/ui/shape-landing-hero"

/**
 * Demo Component
 *
 * A demonstration component that displays:
 * 1. Two variants of the GradientButton side by side
 * 2. The HeroGeometric component with custom text
 */
function Demo() {
  return (
    <div className="flex flex-col gap-8 font-['Overpass_Mono']">
      <div className="flex gap-8 p-4">
        <GradientButton>Log in</GradientButton>
        <GradientButton variant="variant">log in to continue</GradientButton>
      </div>

      <div className="h-screen w-full">
        <HeroGeometric
          badge="Demo Component"
          title1="Showcase Your"
          title2="Amazing Design"
        />
      </div>
    </div>
  )
}

// Demo component specifically for the HeroGeometric
function DemoHeroGeometric() {
  return (
    <HeroGeometric
      badge="Kokonut UI"
      title1="Elevate Your"
      title2="Digital Vision"
    />
  )
}

export { Demo, DemoHeroGeometric }
