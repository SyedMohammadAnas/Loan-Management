/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-overpass-mono)"],
        mono: ["var(--font-overpass-mono)"],
        geist: ["var(--font-geist-sans)"],
        geistmono: ["var(--font-geist-mono)"],
        overpass: ["var(--font-overpass-mono)"]
      },
    },
  },
  plugins: [],
}
