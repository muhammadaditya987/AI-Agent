'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Menu, UserRound } from 'lucide-react';
import { useAuthStore } from '@/providers/auth-store';
import { ThemeToggle } from './theme-toggle';
import { Breadcrumb } from './breadcrumb';
import { Button } from './ui/button';
import { MobileMenu } from './mobile-menu';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    clearSession();
    router.replace('/login');
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-18 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur md:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Button className="md:hidden" variant="ghost" size="icon" aria-label="Open navigation" onClick={() => setMenuOpen(true)}>
            <Menu className="size-5" aria-hidden="true" />
          </Button>
          <Breadcrumb />
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <div className="ml-2 hidden items-center gap-2 border-l border-border pl-4 sm:flex">
            <span className="grid size-8 place-items-center rounded-full bg-coral-100 text-coral-800 dark:bg-coral-950 dark:text-coral-200">
              <UserRound className="size-4" aria-hidden="true" />
            </span>
            <span className="max-w-36 truncate text-xs font-semibold">{user?.name ?? 'Account'}</span>
          </div>
          <Button type="button" variant="ghost" size="icon" aria-label="Sign out" title="Sign out" onClick={() => void logout()}>
            <LogOut className="size-4.5" aria-hidden="true" />
          </Button>
        </div>
      </header>
      <MobileMenu open={menuOpen} onOpenChange={setMenuOpen} />
    </>
  );
}