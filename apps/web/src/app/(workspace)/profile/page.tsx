'use client';

import { useAuth } from '@/hooks/use-auth';
import { UserRound } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  return (
    <div className="max-w-4xl space-y-8">
      <section className="border-b border-border pb-6">
        <p className="mb-3 text-[11px] font-bold uppercase text-teal-800 dark:text-teal-300">Account</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">Identity details supplied by your organization.</p>
      </section>
      <section className="flex items-start gap-5 border-b border-border pb-7">
        <div className="grid size-14 shrink-0 place-items-center rounded-full bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-100"><UserRound className="size-6" aria-hidden="true" /></div>
        <div className="min-w-0">
          <h2 className="wrap-break-word text-xl font-semibold">{user?.name}</h2>
          <p className="mt-1 break-all text-sm text-muted-foreground">{user?.email || 'No email provided by identity provider'}</p>
          <p className="mt-2 text-xs text-muted-foreground">Identity ID: {user?.id}</p>
        </div>
      </section>
      <section>
        <h2 className="text-base font-semibold">Access</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <div><p className="text-xs font-bold uppercase text-muted-foreground">Roles</p><p className="mt-2 text-sm">{user?.roles.length ? user.roles.join(', ') : 'No roles provided'}</p></div>
          <div><p className="text-xs font-bold uppercase text-muted-foreground">Permissions</p><p className="mt-2 wrap-break-word text-sm">{user?.permissions.length ? user.permissions.join(', ') : 'No permissions provided'}</p></div>
        </div>
      </section>
    </div>
  );
}