import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  systemTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  setSystemTheme: (theme: 'light' | 'dark') => void;
  getEffectiveTheme: () => 'light' | 'dark';
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      systemTheme: 'light',

      setTheme: (theme: Theme) => {
        set({ theme });
        applyTheme(get().getEffectiveTheme());
      },

      setSystemTheme: (systemTheme: 'light' | 'dark') => {
        set({ systemTheme });
        // Only apply if current theme is system
        if (get().theme === 'system') {
          applyTheme(systemTheme);
        }
      },

      getEffectiveTheme: () => {
        const { theme, systemTheme } = get();
        return theme === 'system' ? systemTheme : theme;
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);

function applyTheme(theme: 'light' | 'dark') {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

// Initialize theme on load
if (typeof window !== 'undefined') {
  const effectiveTheme = useThemeStore.getState().getEffectiveTheme();
  applyTheme(effectiveTheme);
}