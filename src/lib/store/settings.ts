'use client';

import { atomWithStorage } from 'jotai/utils';

export type Theme = 'light' | 'dark' | 'system';
export type RefreshInterval = 30 | 60 | 120 | 300;

export interface AppSettings {
  theme: Theme;
  refreshInterval: RefreshInterval;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  refreshInterval: 60,
};

export const settingsAtom = atomWithStorage<AppSettings>(
  'astra-settings',
  DEFAULT_SETTINGS
);
