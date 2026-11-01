'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { LoadingScreen } from './loading-screen';

export function AuthGuard({ children }: Readonly<{ children: React.ReactNode }>) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [router, status]);

  if (status === 'loading') return <LoadingScreen label="Checking your session" />;
  if (status === 'unavailable') {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-6">
        <section className="max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold">Local API is unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">Start the NestJS API and database, then retry. Your page will not be redirected in a loop.</p>
          <button className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" onClick={() => window.location.reload()} type="button">
            Retry connection
          </button>
        </section>
      </main>
    );
  }
  if (status !== 'authenticated') return <LoadingScreen label="Checking your session" />;
  return children;
}