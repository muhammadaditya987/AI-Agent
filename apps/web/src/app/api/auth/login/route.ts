import { NextRequest, NextResponse } from 'next/server';
import { authCookieOptions, backendApiUrl } from '@/lib/backend-api';

export const dynamic = 'force-dynamic';

interface BackendSession {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresIn: number;
  user: {
    id: string;
    name: string;
    email: string;
    roles: string[];
    permissions: string[];
  };
}

export async function POST(request: NextRequest) {
  let credentials: unknown;
  try {
    credentials = await request.json();
  } catch {
    return NextResponse.json({ message: 'A valid JSON login request is required.' }, { status: 400 });
  }

  try {
    const backendResponse = await fetch(backendApiUrl('/api/v1/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(credentials),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    const result = await backendResponse.json() as Partial<BackendSession> & { message?: string };
    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: result.message ?? 'Email or password is incorrect.' },
        { status: backendResponse.status },
      );
    }
    if (
      typeof result.accessToken !== 'string' ||
      typeof result.refreshToken !== 'string' ||
      !result.user ||
      typeof result.accessTokenExpiresIn !== 'number' ||
      typeof result.refreshTokenExpiresIn !== 'number'
    ) {
      return NextResponse.json({ message: 'The local API returned an invalid login response.' }, { status: 502 });
    }

    const response = NextResponse.json({ user: result.user });
    response.cookies.set('ai_agency_access', result.accessToken, authCookieOptions(result.accessTokenExpiresIn));
    response.cookies.set('ai_agency_refresh', result.refreshToken, authCookieOptions(result.refreshTokenExpiresIn));
    return response;
  } catch {
    return NextResponse.json(
      { message: 'Could not reach the local API. Start the backend on port 3001 and try again.' },
      { status: 503 },
    );
  }
}