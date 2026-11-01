'use client';

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/providers/auth-store';

type RetryConfig = InternalAxiosRequestConfig & { _retried?: boolean };

export const apiClient = axios.create({
  baseURL: '/api/backend',
  timeout: 12000,
  headers: { Accept: 'application/json' },
});

let refreshRequest: Promise<boolean> | null = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryConfig | undefined;
    if (error.response?.status !== 401 || !config || config._retried) {
      return Promise.reject(error);
    }

    config._retried = true;
    refreshRequest ??= fetch('/api/auth/refresh', { method: 'POST' })
      .then((response) => response.ok)
      .catch(() => false)
      .finally(() => {
        refreshRequest = null;
      });

    const refreshed = await refreshRequest;
    if (!refreshed) {
      useAuthStore.getState().clearSession();
      if (typeof window !== 'undefined') window.location.assign('/login?error=session-expired');
      return Promise.reject(error);
    }

    return apiClient(config);
  },
);