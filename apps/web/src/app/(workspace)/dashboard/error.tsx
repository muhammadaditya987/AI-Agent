'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('Dashboard rendering failed', error); }, [error]);
  return (
    <section className="mx-auto max-w-xl py-20 text-center">
      <h1 className="text-2xl font-semibold">This view could not load</h1>
      <p className="mt-2 text-sm text-muted-foreground">The error was recorded. Try loading the workspace again.</p>
      <Button className="mt-6" onClick={() => reset()}>Retry</Button>
    </section>
  );
}