import { NextRequest, NextResponse } from 'next/server';
import { backendApiUrl } from '@/lib/backend-api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const upstreamUrl = backendApiUrl(path.length === 1 && path[0] === 'metrics' ? '/metrics' : `/${path.join('/')}`);
  request.nextUrl.searchParams.forEach((value, key) => upstreamUrl.searchParams.append(key, value));

  const accessToken = request.cookies.get('ai_agency_access')?.value;
  const headers = new Headers(request.headers);
  headers.delete('cookie');
  headers.delete('host');
  headers.delete('content-length');
  headers.delete('x-automation-token');
  headers.delete('x-content-user-id');
  if (accessToken) headers.set('authorization', `Bearer ${accessToken}`);

  const isContentFactoryRequest =
    path[0] === 'api' &&
    path[1] === 'v1' &&
    path[2] === 'internal' &&
    (path[3] === 'content-factory' || path[3] === 'workflows');
  if (isContentFactoryRequest) {
    if (!accessToken) {
      return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
    }
  }

  let body: string | undefined;
  if (!['GET', 'HEAD'].includes(request.method)) {
    body = await request.text();
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
      redirect: 'manual',
    });

    const contentType = upstream.headers.get('content-type') ?? '';
    const responseBody = contentType.includes('application/json') || contentType.includes('+json')
      ? await upstream.text()
      : await upstream.text();
    const response = new NextResponse(responseBody, {
      status: upstream.status,
      headers: { 'content-type': contentType || 'application/octet-stream' },
    });
    return response;
  } catch {
    return NextResponse.json({ message: 'Backend request failed.' }, { status: 502 });
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context);
}
