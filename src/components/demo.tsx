import { HeroGeometric } from "@/components/ui/shape-landing-hero"

/**
 * DemoHeroGeometric Component
 *
 * Displays the hero section with customized text content
 */
function DemoHeroGeometric() {
    return <HeroGeometric badge="Good Morning Anas"
            title1 = "Anas's"
            title2 = "Personal Loan Management" />
}

/**
 * DemoPage Component
 *
 * A comprehensive demo page that showcases the UI components
 * Displays the HeroGeometric component with integrated gradient button
 */
function DemoPage() {
    return (
        <div className="flex flex-col w-full">
            <DemoHeroGeometric />
        </div>
    )
}

export { DemoHeroGeometric, DemoPage }
