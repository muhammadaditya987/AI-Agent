'use client';

import { useCallback, useMemo } from 'react';
import { useAuthStore } from '@/providers/auth-store';

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const hasPermission = useCallback(
    (permission: string) => user?.permissions.includes(permission) ?? false,
    [user],
  );
  const hasRole = useCallback(
    (role: string) => user?.roles.includes(role) ?? false,
    [user],
  );

  return useMemo(
    () => ({ user, status, hasPermission, hasRole }),
    [hasPermission, hasRole, status, user],
  );
}