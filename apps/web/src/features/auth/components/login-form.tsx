'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { loginSchema, type LoginFormValues } from '../schemas/login.schema';
import { useAuthStore } from '@/providers/auth-store';
import { Button } from '@/components/ui/button';
import type { AuthUser } from '@/types/auth';

export function LoginForm({
  returnTo,
  initialError,
}: {
  returnTo?: string;
  initialError?: string;
}) {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [serverError, setServerError] = useState(initialError ? 'Your session expired. Sign in again.' : '');
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function submit(values: LoginFormValues) {
    setServerError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const result = await response.json() as { user?: AuthUser; message?: string };
      if (!response.ok || !result.user) {
        setServerError(result.message ?? 'Sign in failed. Check your credentials and try again.');
        return;
      }

      setSession(result.user);
      const destination =
        returnTo?.startsWith('/') && !returnTo.startsWith('//') && !returnTo.includes('\\')
          ? returnTo
          : '/dashboard';
      router.replace(destination);
      router.refresh();
    } catch {
      setError('root', { message: 'Could not connect to the local API. Start the backend and try again.' });
    }
  }

  return (
    <form className="mt-7 space-y-5" onSubmit={handleSubmit(submit)} noValidate>
      <div>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="email">Email</label>
        <input
          {...register('email')}
          autoComplete="username"
          className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          id="email"
          type="email"
          autoCapitalize="none"
          autoCorrect="off"
          required
        />
        {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="password">Password</label>
        <input
          {...register('password')}
          autoComplete="current-password"
          className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          id="password"
          type="password"
          required
        />
        {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
      </div>
      {(serverError || errors.root) && (
        <p role="alert" className="border-l-2 border-coral-600 bg-coral-50 px-3 py-2.5 text-sm text-coral-900 dark:bg-coral-950/40 dark:text-coral-100">
          {serverError || errors.root?.message}
        </p>
      )}
      <Button className="w-full" type="submit" disabled={isSubmitting}>
        {isSubmitting
          ? <><LoaderCircle className="size-4 animate-spin" aria-hidden="true" />Signing in…</>
          : <>Sign in locally<ArrowRight className="size-4" aria-hidden="true" /></>}
      </Button>
    </form>
  );
}
