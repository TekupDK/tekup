/** @type {import('tailwindcss').Config} */
const designSystemConfig = {
  darkMode: ["class"],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      fontFamily: {
        orbitron: ['Orbitron', 'monospace'],
        inter: ['Inter', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          glow: 'hsl(var(--primary-glow))',
          dark: 'hsl(var(--primary-dark))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
          glass: 'hsl(var(--card-glass))'
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        },
        // TekUp ecosystem specific colors
        'neon-blue': 'hsl(var(--neon-blue))',
        'neon-cyan': 'hsl(var(--neon-cyan))',
        'glass-border': 'hsl(var(--glass-border) / <alpha-value>)',
        'ecosystem-dark': 'hsl(var(--ecosystem-dark))',
        'dashboard-surface': 'hsl(var(--dashboard-surface))'
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0'
          },
          to: {
            height: 'var(--radix-accordion-content-height)'
          }
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)'
          },
          to: {
            height: '0'
          }
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-10px) rotate(1deg)' },
          '66%': { transform: 'translateY(-5px) rotate(-1deg)' }
        },
        'pulse-neon': {
          '0%, 100%': { 
            opacity: '1',
            boxShadow: '0 0 20px hsl(195 100% 50% / 0.3)'
          },
          '50%': { 
            opacity: '0.8',
            boxShadow: '0 0 40px hsl(195 100% 50% / 0.6)'
          }
        },
        'data-flow': {
          '0%': { transform: 'translateX(-100%) scale(0)' },
          '50%': { transform: 'translateX(0%) scale(1)' },
          '100%': { transform: 'translateX(100%) scale(0)' }
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' }
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' }
        },
        'fade-in-up': {
          '0%': { 
            opacity: '0',
            transform: 'translateY(30px)'
          },
          '100%': { 
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        'slide-in': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' }
        },
        'scale-in': {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'pulse-neon': 'pulse-neon 2s ease-in-out infinite',
        'data-flow': 'data-flow 3s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'gradient-x': 'gradient-x 3s ease infinite',
        'fade-in-up': 'fade-in-up 0.6s ease-out',
        'slide-in': 'slide-in 0.4s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite'
      },
      backgroundSize: {
        'size-200': '200% 200%',
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'mesh-gradient': 'var(--gradient-mesh)',
        'ecosystem-gradient': 'var(--gradient-ecosystem)',
        'neon-gradient': 'var(--gradient-neon)',
        'glass-gradient': 'var(--gradient-glass)',
      },
      boxShadow: {
        'neon': 'var(--shadow-neon)',
        'glass': 'var(--shadow-glass)',
        'ecosystem': 'var(--shadow-ecosystem)',
        'floating': 'var(--shadow-floating)',
        'neon-intense': '0 0 40px hsl(195 100% 50% / 0.6), 0 0 80px hsl(195 100% 50% / 0.3)'
      },
      transitionTimingFunction: {
        'ecosystem': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-out': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
      }
    }
  },
  plugins: []
};

module.exports = designSystemConfig;
