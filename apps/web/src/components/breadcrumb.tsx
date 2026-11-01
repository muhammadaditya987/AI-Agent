'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

const labels: Record<string, string> = {
  dashboard: 'Overview',
  settings: 'Settings',
  profile: 'Profile',
};

export function Breadcrumb() {
  const segments = usePathname().split('/').filter(Boolean);
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground">
      <Link href="/dashboard" className="transition-colors hover:text-foreground">Workspace</Link>
      {segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join('/')}`;
        return (
          <span className="flex items-center gap-2" key={href}>
            <ChevronRight className="size-3.5" aria-hidden="true" />
            <span className={index === segments.length - 1 ? 'font-medium text-foreground' : ''}>
              {labels[segment] ?? segment}
            </span>
          </span>
        );
      })}
    </nav>
  );
}