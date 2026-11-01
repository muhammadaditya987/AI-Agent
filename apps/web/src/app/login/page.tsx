import type { Metadata } from 'next';
import Link from 'next/link';
import { Bot, ShieldCheck } from 'lucide-react';
import { LoginForm } from '@/features/auth/components/login-form';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to the AI Agency operations workspace.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; returnTo?: string }>;
}) {
  const { error, returnTo } = await searchParams;
  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-ink px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-20">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(120deg, transparent 35%, rgba(52, 211, 153, .15) 35.1%, transparent 35.5%), linear-gradient(30deg, transparent 64%, rgba(251, 146, 60, .12) 64.1%, transparent 64.5%)' }} />
        <Link href="/" className="relative flex items-center gap-3 text-sm font-bold"><span className="grid size-9 place-items-center rounded-lg bg-teal-400 text-ink"><Bot className="size-5" aria-hidden="true" /></span>AI Agency</Link>
        <div className="relative max-w-xl pb-12">
          <p className="mb-5 text-xs font-bold uppercase text-teal-300">Local workspace</p>
          <h1 className="font-display text-5xl font-semibold leading-[1.12]">Make intelligent work feel operational.</h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-slate-300">Your AI agency workspace, running locally with a private backend session.</p>
        </div>
        <p className="relative text-xs text-slate-400">AI Agency Platform · Private workspace</p>
      </section>
      <section className="flex min-h-screen flex-col px-6 py-7 sm:px-12 lg:px-16">
        <Link href="/" className="flex items-center gap-3 text-sm font-bold lg:hidden"><span className="grid size-9 place-items-center rounded-lg bg-teal-700 text-white"><Bot className="size-5" aria-hidden="true" /></span>AI Agency</Link>
        <div className="mx-auto flex w-full max-w-100 flex-1 flex-col justify-center py-16">
          <div className="mb-7 grid size-12 place-items-center rounded-lg bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-100"><ShieldCheck className="size-6" aria-hidden="true" /></div>
          <p className="mb-2 text-[11px] font-bold uppercase text-teal-800 dark:text-teal-300">Local development account</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight">Sign in to your workspace</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Sign in through the local NestJS API. No external identity provider is required.</p>
          <LoginForm returnTo={returnTo} initialError={error} />
          <p className="mt-5 rounded-md bg-muted px-3 py-2.5 text-xs text-muted-foreground">
            Default local account: <strong>admin@local.test</strong> · <strong>LocalDev123!</strong>
          </p>
        </div>
        <p className="text-center text-[11px] text-muted-foreground">Local API · HttpOnly session cookies</p>
      </section>
    </main>
  );
}