'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, CircleHelp, PanelLeftClose } from 'lucide-react';
import { navigationItems } from '@/constants/navigation';
import { contentFactoryTools } from '@/constants/content-factory';
import { cn } from '@/lib/utils';

export function Sidebar({ onNavigate }: Readonly<{ onNavigate?: () => void }>) {
  const pathname = usePathname();
  return (
    <aside className="flex h-full flex-col border-r border-border bg-sidebar">
      <Link href="/dashboard" className="flex h-18 items-center gap-3 border-b border-border px-6" onClick={onNavigate}>
        <span className="grid size-9 place-items-center rounded-lg bg-teal-700 text-white dark:bg-teal-500 dark:text-slate-950">
          <Bot className="size-5" aria-hidden="true" />
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-bold tracking-tight">AI Agency</span>
          <span className="mt-1 block text-[11px] text-muted-foreground">OPERATIONS</span>
        </span>
      </Link>

      <div className="px-4 pt-7">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase text-muted-foreground">Workspace</p>
        <nav className="space-y-1" aria-label="Main navigation">
          {navigationItems.map(({ label, href, icon: Icon }) => {
            const active = href.includes('#')
              ? pathname === '/dashboard'
              : href === '/content-factory'
                ? pathname.startsWith('/content-factory')
                : pathname === href;
            return (
              <Link
                href={href}
                key={href}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-10 items-center gap-3 rounded-md px-3 text-[13px] font-medium transition-colors',
                  active ? 'bg-teal-100 text-teal-950 dark:bg-teal-950 dark:text-teal-100' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="size-4.25" aria-hidden="true" />{label}
              </Link>
            );
          })}
          {pathname.startsWith('/content-factory') ? (
            <div className="ml-5 mt-1 space-y-1 border-l border-border pl-3">
              {contentFactoryTools.map(({ slug, label, icon: Icon }) => {
                const href = `/content-factory/${slug}`;
                const active = pathname === href;
                return (
                  <Link
                    href={href}
                    key={slug}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex min-h-9 items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium transition-colors',
                      active ? 'bg-teal-100 text-teal-950 dark:bg-teal-950 dark:text-teal-100' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          ) : null}
        </nav>
      </div>

      <div className="mt-auto border-t border-border p-4">
        <div className="flex items-center gap-3 rounded-md px-2 py-3 text-xs text-muted-foreground">
          <CircleHelp className="size-4 shrink-0" aria-hidden="true" />
          <span>Need help? Contact your platform administrator.</span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-4 text-[11px] text-muted-foreground">
          <span>AI Agency Platform</span><PanelLeftClose className="size-4" aria-hidden="true" />
        </div>
      </div>
    </aside>
  );
}