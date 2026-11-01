module.exports = [
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/runtime-reacts.external.js [external] (next/dist/server/runtime-reacts.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/runtime-reacts.external.js", () => require("next/dist/server/runtime-reacts.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/node:stream [external] (node:stream, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:stream", () => require("node:stream"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[project]/apps/web/src/app/api/backend/[...path]/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DELETE",
    ()=>DELETE,
    "GET",
    ()=>GET,
    "PATCH",
    ()=>PATCH,
    "POST",
    ()=>POST,
    "PUT",
    ()=>PUT,
    "dynamic",
    ()=>dynamic,
    "runtime",
    ()=>runtime
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$backend$2d$api$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/backend-api.ts [app-route] (ecmascript)");
;
;
const dynamic = 'force-dynamic';
const runtime = 'nodejs';
async function proxy(request, context) {
    const { path } = await context.params;
    const upstreamUrl = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$backend$2d$api$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["backendApiUrl"])(path.length === 1 && path[0] === 'metrics' ? '/metrics' : `/${path.join('/')}`);
    request.nextUrl.searchParams.forEach((value, key)=>upstreamUrl.searchParams.append(key, value));
    const accessToken = request.cookies.get('ai_agency_access')?.value;
    const headers = new Headers(request.headers);
    headers.delete('cookie');
    headers.delete('host');
    headers.delete('content-length');
    headers.delete('x-automation-token');
    headers.delete('x-content-user-id');
    if (accessToken) headers.set('authorization', `Bearer ${accessToken}`);
    const isContentFactoryRequest = path[0] === 'api' && path[1] === 'v1' && path[2] === 'internal' && (path[3] === 'content-factory' || path[3] === 'workflows');
    if (isContentFactoryRequest) {
        if (!accessToken) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                message: 'Authentication required.'
            }, {
                status: 401
            });
        }
    }
    let body;
    if (![
        'GET',
        'HEAD'
    ].includes(request.method)) {
        body = await request.text();
    }
    try {
        const upstream = await fetch(upstreamUrl, {
            method: request.method,
            headers,
            body,
            cache: 'no-store',
            signal: AbortSignal.timeout(15000),
            redirect: 'manual'
        });
        const contentType = upstream.headers.get('content-type') ?? '';
        const responseBody = contentType.includes('application/json') || contentType.includes('+json') ? await upstream.text() : await upstream.text();
        const response = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"](responseBody, {
            status: upstream.status,
            headers: {
                'content-type': contentType || 'application/octet-stream'
            }
        });
        return response;
    } catch  {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            message: 'Backend request failed.'
        }, {
            status: 502
        });
    }
}
async function GET(request, context) {
    return proxy(request, context);
}
async function POST(request, context) {
    return proxy(request, context);
}
async function PATCH(request, context) {
    return proxy(request, context);
}
async function PUT(request, context) {
    return proxy(request, context);
}
async function DELETE(request, context) {
    return proxy(request, context);
}
}),
"[project]/apps/web/src/lib/backend-api.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "authCookieOptions",
    ()=>authCookieOptions,
    "backendApiUrl",
    ()=>backendApiUrl
]);
const backendApiBaseUrl = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';
function backendApiUrl(path) {
    return new URL(path.replace(/^\/+/, ''), `${backendApiBaseUrl.replace(/\/+$/, '')}/`);
}
function authCookieOptions(maxAge) {
    return {
        httpOnly: true,
        secure: ("TURBOPACK compile-time value", "development") === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge
    };
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__1q_cbznt3-nnp._.js.map