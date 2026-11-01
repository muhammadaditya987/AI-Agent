'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('Application rendering failed', error); }, [error]);

  return (
    <html lang="en">
      <body className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
        <main className="max-w-md text-center">
          <h1 className="font-display text-3xl font-semibold">We could not load this page</h1>
          <p className="mt-3 text-sm text-muted-foreground">Try again. If the problem continues, contact your platform administrator.</p>
          <Button className="mt-6" onClick={() => reset()}>Retry</Button>
        </main>
      </body>
    </html>
  );
}