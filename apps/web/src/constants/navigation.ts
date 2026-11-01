import { Activity, CircleUserRound, LayoutDashboard, Settings2, Sparkles, Workflow } from 'lucide-react';

export const navigationItems = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'AI Content Factory', href: '/content-factory', icon: Sparkles },
  { label: 'Workflow Builder', href: '/workflows', icon: Workflow },
  { label: 'Service health', href: '/dashboard#health', icon: Activity },
  { label: 'Settings', href: '/settings', icon: Settings2 },
  { label: 'Profile', href: '/profile', icon: CircleUserRound },
] as const;