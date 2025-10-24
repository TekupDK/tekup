/**
 * 🎨 RendetaljeOS Design System
 *
 * Modern, professional theme with support for light/dark mode
 * Following iOS Human Interface Guidelines and Material Design principles
 */

export const colors = {
  // Primary Brand Colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',  // Main brand color
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  // Success Colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',  // Main success
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },

  // Warning Colors
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',  // Main warning
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  // Error Colors
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',  // Main error
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  // Neutral Colors (Light Mode)
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },

  // Semantic Colors
  background: {
    light: '#ffffff',
    dark: '#0f172a',
  },
  surface: {
    light: '#f8fafc',
    dark: '#1e293b',
  },
  border: {
    light: '#e2e8f0',
    dark: '#334155',
  },
  text: {
    primary: {
      light: '#0f172a',
      dark: '#f8fafc',
    },
    secondary: {
      light: '#64748b',
      dark: '#94a3b8',
    },
    disabled: {
      light: '#cbd5e1',
      dark: '#475569',
    },
  },
};

export const typography = {
  // Font Families
  fonts: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },

  // Font Sizes
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },

  // Line Heights
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },

  // Font Weights
  weights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
};

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
};

export const shadows = {
  // iOS-style shadows
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const animations = {
  // Timing
  duration: {
    fast: 150,
    normal: 250,
    slow: 350,
  },

  // Easing
  easing: {
    default: 'ease-in-out',
    in: 'ease-in',
    out: 'ease-out',
    spring: 'spring',
  },
};

export const layout = {
  // Screen padding
  screenPadding: spacing.md,

  // Container max width
  containerMaxWidth: 600,

  // Safe area insets
  safeAreaTop: 0,
  safeAreaBottom: 0,

  // Header height
  headerHeight: 56,

  // Tab bar height
  tabBarHeight: 60,

  // Card padding
  cardPadding: spacing.md,

  // Section spacing
  sectionSpacing: spacing.lg,
};

// Theme presets
export type ThemeMode = 'light' | 'dark';

export const createTheme = (mode: ThemeMode = 'light') => ({
  colors: {
    primary: colors.primary[500],
    primaryLight: colors.primary[100],
    primaryDark: colors.primary[700],

    success: colors.success[500],
    successLight: colors.success[100],

    warning: colors.warning[500],
    warningLight: colors.warning[100],

    error: colors.error[500],
    errorLight: colors.error[100],

    background: mode === 'light' ? colors.background.light : colors.background.dark,
    surface: mode === 'light' ? colors.surface.light : colors.surface.dark,
    border: mode === 'light' ? colors.border.light : colors.border.dark,

    textPrimary: mode === 'light' ? colors.text.primary.light : colors.text.primary.dark,
    textSecondary: mode === 'light' ? colors.text.secondary.light : colors.text.secondary.dark,
    textDisabled: mode === 'light' ? colors.text.disabled.light : colors.text.disabled.dark,
  },
  typography,
  spacing,
  borderRadius,
  shadows,
  animations,
  layout,
  mode,
});

export type Theme = ReturnType<typeof createTheme>;

// Default light theme
export const lightTheme = createTheme('light');

// Dark theme
export const darkTheme = createTheme('dark');

export default lightTheme;
