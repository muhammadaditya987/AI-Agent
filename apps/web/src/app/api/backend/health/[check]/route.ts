import { NextRequest, NextResponse } from 'next/server';
import { backendApiUrl } from '@/lib/backend-api';

const allowedChecks = new Set(['live', 'ready']);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ check: string }> },
) {
  const { check } = await context.params;
  if (!allowedChecks.has(check)) {
    return NextResponse.json({ message: 'Not found.' }, { status: 404 });
  }

  try {
    const upstream = await fetch(backendApiUrl(`/api/v1/health/${check}`), {
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    const body = await upstream.json();
    return NextResponse.json(body, { status: upstream.status });
  } catch {
    return NextResponse.json(
      { status: 'error', message: 'Backend health check is unavailable.' },
      { status: 502 },
    );
  }
}