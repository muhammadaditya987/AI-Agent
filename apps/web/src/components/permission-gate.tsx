'use client';

import { useAuth } from '@/hooks/use-auth';

export function PermissionGate({
  permission,
  children,
  fallback = null,
}: Readonly<{
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}>) {
  const { hasPermission } = useAuth();
  return hasPermission(permission) ? children : fallback;
}