'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from './auth-store';
import type { AuthSession } from '@/types/auth';

async function getSession(): Promise<{ session?: AuthSession; unavailable: boolean }> {
  let response: Response;
  try {
    response = await fetch('/api/auth/session', { cache: 'no-store' });
  } catch {
    return { unavailable: true };
  }
  if (response.status === 401) {
    try {
      const refreshed = await fetch('/api/auth/refresh', { method: 'POST' });
      if (refreshed.status === 401) return { unavailable: false };
      if (!refreshed.ok) return { unavailable: true };
      response = await fetch('/api/auth/session', { cache: 'no-store' });
    } catch {
      return { unavailable: true };
    }
  }
  if (response.status === 401) return { unavailable: false };
  if (!response.ok) return { unavailable: true };
  return { session: await response.json() as AuthSession, unavailable: false };
}

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const status = useAuthStore((state) => state.status);
  const setSession = useAuthStore((state) => state.setSession);
  const setStatus = useAuthStore((state) => state.setStatus);
  const clearSession = useAuthStore((state) => state.clearSession);

  useEffect(() => {
    let active = true;
    void getSession().then(({ session, unavailable }) => {
      if (!active) return;
      if (session) setSession(session.user);
      else if (unavailable) setStatus('unavailable');
      else clearSession();
    }).catch(() => {
      if (!active) return;
      setStatus('unavailable');
    });

    return () => {
      active = false;
    };
  }, [clearSession, setSession, setStatus]);

  useEffect(() => {
    if (status === 'unauthenticated' && pathname !== '/login') {
      router.replace('/login');
    }
  }, [pathname, router, status]);

  return children;
}