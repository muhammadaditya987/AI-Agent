const backendApiBaseUrl =
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://127.0.0.1:3001';

export function backendApiUrl(path: string): URL {
  return new URL(path.replace(/^\/+/, ''), `${backendApiBaseUrl.replace(/\/+$/, '')}/`);
}

export function authCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}
