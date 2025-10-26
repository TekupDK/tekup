/*****************************************
 * Tailwind Config (TekUp CRM Web)
 *****************************************/
import { fontFamily } from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...fontFamily.sans]
      },
      colors: {
        brand: {
          rendetalje: '#059669',
          foodtruck: '#dc2626',
          tekup: '#7c3aed'
        }
      }
    }
  },
  plugins: []
};