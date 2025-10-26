import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // P3 wide gamut colors support
        primary: {
          50: 'color(display-p3 0.95 0.98 1)',
          100: 'color(display-p3 0.9 0.95 1)',
          500: 'color(display-p3 0.3 0.6 1)',
          600: 'color(display-p3 0.25 0.5 0.95)',
          900: 'color(display-p3 0.1 0.2 0.5)',
        },
        success: {
          50: 'color(display-p3 0.92 0.98 0.95)',
          500: 'color(display-p3 0.13 0.8 0.4)',
          600: 'color(display-p3 0.1 0.7 0.35)',
        },
        warning: {
          50: 'color(display-p3 0.98 0.96 0.9)',
          500: 'color(display-p3 0.95 0.7 0.2)',
          600: 'color(display-p3 0.85 0.6 0.15)',
        },
        error: {
          50: 'color(display-p3 0.98 0.92 0.92)',
          500: 'color(display-p3 0.9 0.2 0.2)',
          600: 'color(display-p3 0.8 0.15 0.15)',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        // Glassmorphism gradients
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
        'glass-border': 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
      // Container queries support
      container: {
        screens: {
          '2xs': '375px',
          xs: '475px',
          sm: '640px',
          md: '768px',
          lg: '1024px',
          xl: '1280px',
          '2xl': '1536px',
        },
      },
      // 3D transforms
      perspective: {
        '1000': '1000px',
        '1500': '1500px',
      },
      transformStyle: {
        'preserve-3d': 'preserve-3d',
      },
    },
  },
  plugins: [
    // Container queries plugin
    require('@tailwindcss/container-queries'),
    
    // Custom glassmorphism utility
    function({ addUtilities }: { addUtilities: Function }) {
      addUtilities({
        '.glass': {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        },
        '.glass-dark': {
          background: 'rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        '.perspective-1000': {
          perspective: '1000px',
        },
        '.preserve-3d': {
          transformStyle: 'preserve-3d',
        },
      })
    },
  ],
  // CSS-first configuration
  corePlugins: {
    preflight: true,
  },
  // Enable JIT mode for better performance
  mode: 'jit',
}

export default config
