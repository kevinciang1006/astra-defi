'use client';

import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { Settings, Sun, Moon, Monitor, Timer } from 'lucide-react';
import { settingsAtom, type Theme, type RefreshInterval } from '@/lib/store/settings';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';

const THEME_OPTIONS: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
  { value: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> },
  { value: 'system', label: 'System', icon: <Monitor className="h-4 w-4" /> },
];

const REFRESH_OPTIONS: { label: string; value: string }[] = [
  { label: '30 seconds', value: '30' },
  { label: '1 minute', value: '60' },
  { label: '2 minutes', value: '120' },
  { label: '5 minutes', value: '300' },
];

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  } else {
    root.classList.toggle('dark', theme === 'dark');
  }
}

/** Hook that applies the theme from settings and listens for system changes. */
export function useThemeEffect() {
  const [settings] = useAtom(settingsAtom);

  useEffect(() => {
    applyTheme(settings.theme);

    if (settings.theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme('system');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [settings.theme]);
}

export function SettingsPanel() {
  const [settings, setSettings] = useAtom(settingsAtom);

  const setTheme = (theme: Theme) => {
    setSettings((prev) => ({ ...prev, theme }));
  };

  const setRefreshInterval = (interval: RefreshInterval) => {
    setSettings((prev) => ({ ...prev, refreshInterval: interval }));
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Settings
        </button>
      </SheetTrigger>
      <SheetContent>
        <SheetTitle className="sr-only">Creator Details</SheetTitle>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </SheetTitle>
          <SheetDescription>Customize your dashboard preferences.</SheetDescription>
        </SheetHeader>

        <div className="mt-8 space-y-8">
          {/* Theme */}
          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">Theme</label>
            <div className="grid grid-cols-3 gap-2">
              {THEME_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={settings.theme === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme(option.value)}
                  className="gap-1.5"
                >
                  {option.icon}
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Refresh Interval */}
          <div>
            <label className="text-sm font-medium text-foreground mb-3 flex items-center gap-1.5">
              <Timer className="h-4 w-4" />
              Auto-Refresh Interval
            </label>
            <Select
              options={REFRESH_OPTIONS}
              value={settings.refreshInterval.toString()}
              onChange={(e) => setRefreshInterval(Number(e.target.value) as RefreshInterval)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-2">
              How often portfolio data is automatically refreshed.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
