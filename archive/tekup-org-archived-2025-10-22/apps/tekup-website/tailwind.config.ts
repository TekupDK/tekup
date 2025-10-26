import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand Colors (P3 Wide Gamut)
        primary: {
          50: "oklch(98% 0.01 260)",
          100: "oklch(93% 0.04 260)",
          200: "oklch(85% 0.08 260)",
          300: "oklch(75% 0.13 260)",
          400: "oklch(65% 0.17 260)",
          500: "oklch(55% 0.22 260)", // TekUp Blue
          600: "oklch(50% 0.24 260)",
          700: "oklch(42% 0.20 260)",
          800: "oklch(33% 0.16 260)",
          900: "oklch(25% 0.12 260)",
          950: "oklch(15% 0.08 260)",
        },
        accent: {
          50: "oklch(95% 0.02 180)",
          100: "oklch(90% 0.05 180)",
          200: "oklch(82% 0.10 180)",
          300: "oklch(72% 0.16 180)",
          400: "oklch(62% 0.21 180)",
          500: "oklch(55% 0.24 180)", // Electric Cyan
          600: "oklch(48% 0.22 180)",
          700: "oklch(40% 0.18 180)",
          800: "oklch(32% 0.14 180)",
          900: "oklch(25% 0.10 180)",
          950: "oklch(15% 0.06 180)",
        },
        // Glassmorphism Glass Colors
        glass: {
          white: "rgba(255, 255, 255, 0.1)",
          "white-strong": "rgba(255, 255, 255, 0.2)",
          dark: "rgba(0, 0, 0, 0.1)",
          "dark-strong": "rgba(0, 0, 0, 0.2)",
        },
        // Gradients
        gradient: {
          primary: "linear-gradient(135deg, oklch(55% 0.22 260), oklch(55% 0.24 180))",
          accent: "linear-gradient(135deg, oklch(55% 0.24 180), oklch(65% 0.17 260))",
          mesh: "radial-gradient(circle at 20% 50%, oklch(55% 0.22 260) 0%, transparent 50%), radial-gradient(circle at 80% 20%, oklch(55% 0.24 180) 0%, transparent 50%)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Consolas", "monospace"],
        display: ["Orbitron", "Inter", "system-ui", "sans-serif"],
      },
      backdropBlur: {
        xs: "2px",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "mesh-gradient": "radial-gradient(circle at 20% 50%, oklch(55% 0.22 260) 0%, transparent 50%), radial-gradient(circle at 80% 20%, oklch(55% 0.24 180) 0%, transparent 50%)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "scale-in": "scaleIn 0.3s ease-out",
        "float": "float 6s ease-in-out infinite",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite alternate",
        "gradient-shift": "gradientShift 8s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        pulseGlow: {
          "0%": { boxShadow: "0 0 20px rgba(79, 70, 229, 0.4)" },
          "100%": { boxShadow: "0 0 40px rgba(79, 70, 229, 0.8)" },
        },
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      container: {
        center: true,
        padding: {
          DEFAULT: "1rem",
          sm: "1.5rem",
          lg: "2rem",
          xl: "2.5rem",
          "2xl": "3rem",
        },
        screens: {
          sm: "640px",
          md: "768px",
          lg: "1024px",
          xl: "1280px",
          "2xl": "1400px",
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/container-queries"),
  ],
};
export default config;
