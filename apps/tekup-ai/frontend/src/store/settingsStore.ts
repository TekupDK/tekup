import type { SettingsState } from '@/types';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SettingsStore {
  settings: SettingsState;
  updateSettings: (payload: Partial<SettingsState>) => void;
  resetSettings: () => void;
}

const defaultSettings: SettingsState = {
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.7,
  maxTokens: 4096,
  topP: 0.9,
  enableMemory: true,
  enableAutoMemory: true,
  memoryRetention: 30,
  maxMemorySize: 1000,
  theme: 'system',
  compactMode: false,
  showTimestamps: true,
  enableSoundEffects: false,
  enableNotifications: true,
  fontSize: 'medium',
};

const settingsStoreCreator = (
  set: (
    partial:
      | SettingsStore
      | Partial<SettingsStore>
      | ((state: SettingsStore) => SettingsStore | Partial<SettingsStore>),
    replace?: boolean
  ) => void,
  get: () => SettingsStore
) => ({
  settings: defaultSettings,
  updateSettings(payload: Partial<SettingsState>) {
    set((state) => ({
      settings: {
        ...state.settings,
        ...payload,
      },
    }));
  },
  resetSettings() {
    set({ settings: defaultSettings });
  },
});

export const useSettingsStore = create<SettingsStore>()(
  persist(settingsStoreCreator, {
    name: 'tekup-ai-settings',
    storage: createJSONStorage<SettingsStore>(() => localStorage),
  })
);
