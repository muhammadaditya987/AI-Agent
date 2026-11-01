'use client';

import { Header } from './header';
import { Sidebar } from './sidebar';

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="fixed inset-y-0 left-0 hidden w-62 md:block"><Sidebar /></div>
      <div className="md:pl-62">
        <Header />
        <main className="mx-auto w-full max-w-360 px-5 py-8 md:px-8 md:py-10">{children}</main>
      </div>
    </div>
  );
}