/*****************************************
 * Tailwind Config (TekUp Flow Web)
 * Using TekUp Futuristic Design System
 *****************************************/
import { fontFamily } from 'tailwindcss/defaultTheme';
import designSystemConfig from '@tekup/design-system/tailwind';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: designSystemConfig.darkMode,
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    ...designSystemConfig.theme,
    extend: {
      ...designSystemConfig.theme.extend,
      fontFamily: {
        ...designSystemConfig.theme.extend.fontFamily,
        sans: ['Inter', ...fontFamily.sans]
      },
      colors: {
        ...designSystemConfig.theme.extend.colors,
        brand: {
          rendetalje: '#059669',
          foodtruck: '#dc2626',
          tekup: '#7c3aed'
        }
      }
    }
  },
  plugins: [...(designSystemConfig.plugins || [])]
};
