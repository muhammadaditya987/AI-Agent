'use client';

import { create } from 'zustand';
import type { AuthUser } from '@/types/auth';

interface AuthState {
  user: AuthUser | null;
  status: 'loading' | 'authenticated' | 'unauthenticated' | 'unavailable';
  setSession: (user: AuthUser) => void;
  setStatus: (status: AuthState['status']) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'loading',
  setSession: (user) => set({ user, status: 'authenticated' }),
  setStatus: (status) => set({ status }),
  clearSession: () => set({ user: null, status: 'unauthenticated' }),
}));