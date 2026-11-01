import { NextRequest, NextResponse } from 'next/server';
import { authCookieOptions, backendApiUrl } from '@/lib/backend-api';

export const dynamic = 'force-dynamic';

interface BackendSession {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresIn: number;
}

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get('ai_agency_refresh')?.value;
  if (!refreshToken) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  try {
    const backendResponse = await fetch(backendApiUrl('/api/v1/auth/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    const result = await backendResponse.json() as Partial<BackendSession> & { message?: string };
    if (!backendResponse.ok) {
      const response = NextResponse.json(
        { message: result.message ?? 'Session expired. Sign in again.' },
        { status: backendResponse.status },
      );
      if (backendResponse.status === 401) {
        response.cookies.delete('ai_agency_access');
        response.cookies.delete('ai_agency_refresh');
      }
      return response;
    }

    if (
      typeof result.accessToken !== 'string' ||
      typeof result.refreshToken !== 'string' ||
      typeof result.accessTokenExpiresIn !== 'number' ||
      typeof result.refreshTokenExpiresIn !== 'number'
    ) {
      return NextResponse.json({ message: 'The local API returned an invalid refresh response.' }, { status: 502 });
    }
    const response = NextResponse.json({ refreshed: true });
    response.cookies.set('ai_agency_access', result.accessToken, authCookieOptions(result.accessTokenExpiresIn));
    response.cookies.set('ai_agency_refresh', result.refreshToken, authCookieOptions(result.refreshTokenExpiresIn));
    return response;
  } catch (error) {
    console.error('Local API refresh request failed', error);
    return NextResponse.json({ message: 'Could not reach the local API.' }, { status: 503 });
  }
}