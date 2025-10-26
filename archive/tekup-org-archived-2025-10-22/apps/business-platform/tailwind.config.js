/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'tekup-blue': '#2563EB',
        'tekup-purple': '#7C3AED',
        'tekup-yellow': '#F59E0B',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        }
      }
    },
  },
  plugins: [],
  safelist: [
    'bg-red-50',
    'bg-yellow-50', 
    'bg-orange-50',
    'bg-green-50',
    'bg-blue-50',
    'border-red-200',
    'border-yellow-200',
    'border-orange-200', 
    'border-green-200',
    'border-blue-200',
    'text-red-700',
    'text-yellow-700',
    'text-orange-700',
    'text-green-600',
    'text-blue-600'
  ]
}