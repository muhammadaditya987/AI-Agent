import { NextRequest, NextResponse } from 'next/server';
import { backendApiUrl } from '@/lib/backend-api';

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get('ai_agency_refresh')?.value;
  let status = 200;
  let message = '';
  if (refreshToken) {
    try {
      const backendResponse = await fetch(backendApiUrl('/api/v1/auth/logout'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      });
      if (!backendResponse.ok) {
        status = 502;
        message = 'Local API could not revoke the session.';
      }
    } catch (error) {
      console.error('Local API logout request failed', error);
      status = 503;
      message = 'Could not reach the local API. The browser session was cleared.';
    }
  }

  const response = NextResponse.json({ signedOut: true, ...(message ? { message } : {}) }, { status });
  response.cookies.delete('ai_agency_access');
  response.cookies.delete('ai_agency_refresh');
  return response;
}