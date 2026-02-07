import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings, ResearchTier, TLPLevel, ApiKeys } from '../types';

interface SettingsState extends AppSettings {
  setDefaultTier: (tier: ResearchTier) => void;
  setDefaultTlp: (tlp: TLPLevel) => void;
  setApiKey: (provider: keyof ApiKeys, key: string) => void;
  removeApiKey: (provider: keyof ApiKeys) => void;
  setEnabledSections: (sections: string[]) => void;
  hasApiKey: (provider: keyof ApiKeys) => boolean;
  reset: () => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  defaultTier: 'FREE',
  defaultTlp: 'TLP:GREEN',
  apiKeys: {},
  enabledSections: [
    'bluf',
    'threat-actor-profile',
    'campaign-overview',
    'ttps',
    'iocs',
    'victimology',
    'timeline',
    'attribution',
    'remediation',
    'sources',
  ],
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,

      setDefaultTier: (tier) => set({ defaultTier: tier }),

      setDefaultTlp: (tlp) => set({ defaultTlp: tlp }),

      setApiKey: (provider, key) =>
        set((state) => ({
          apiKeys: { ...state.apiKeys, [provider]: key },
        })),

      removeApiKey: (provider) =>
        set((state) => {
          const keys = { ...state.apiKeys };
          delete keys[provider];
          return { apiKeys: keys };
        }),

      setEnabledSections: (sections) => set({ enabledSections: sections }),

      hasApiKey: (provider) => {
        const key = get().apiKeys[provider];
        return typeof key === 'string' && key.length > 0;
      },

      reset: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'cyberbrief-settings',
    }
  )
);
