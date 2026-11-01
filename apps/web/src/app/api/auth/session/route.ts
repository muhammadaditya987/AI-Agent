import { NextRequest, NextResponse } from 'next/server';
import { backendApiUrl } from '@/lib/backend-api';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get('ai_agency_access')?.value;
  if (!accessToken) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  try {
    const backendResponse = await fetch(backendApiUrl('/api/v1/auth/me'), {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    const result = await backendResponse.json() as { user?: unknown; message?: string };
    return NextResponse.json(
      backendResponse.ok ? result : { message: result.message ?? 'Session expired.' },
      { status: backendResponse.status },
    );
  } catch (error) {
    console.error('Local API session request failed', error);
    return NextResponse.json({ message: 'Could not reach the local API.' }, { status: 503 });
  }
}