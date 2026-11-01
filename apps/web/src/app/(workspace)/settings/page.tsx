'use client';

import { useTheme } from 'next-themes';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const themes = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const;

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="max-w-4xl space-y-8">
      <section className="border-b border-border pb-6">
        <p className="mb-3 text-[11px] font-bold uppercase text-teal-800 dark:text-teal-300">Workspace</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">Control the appearance of your workspace.</p>
      </section>
      <section className="border-b border-border pb-7">
        <h2 className="text-base font-semibold">Appearance</h2>
        <p className="mt-1 text-sm text-muted-foreground">Choose how the workspace is displayed on this device.</p>
        <div className="mt-5 grid max-w-130 grid-cols-3 gap-2" role="group" aria-label="Color theme">
          {themes.map(({ value, label, icon: Icon }) => {
            const selected = mounted && theme === value;
            return (
              <Button
                key={value}
                type="button"
                variant={selected ? 'primary' : 'secondary'}
                aria-pressed={selected}
                onClick={() => { setTheme(value); toast.success(`${label} theme selected`); }}
              >
                <Icon className="size-4" aria-hidden="true" />{label}
              </Button>
            );
          })}
        </div>
      </section>
      <section>
        <h2 className="text-base font-semibold">Session security</h2>
        <p className="mt-1 text-sm text-muted-foreground">Identity is managed by your organization. Session tokens are held in secure, HTTP-only cookies.</p>
      </section>
    </div>
  );
}