import { type NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/org')) {
    const slug = pathname.split('/')[2];
    request.cookies.set('org', slug);
    const response = NextResponse.next({ request });
    response.cookies.set('org', slug);

    return response;
  }

  request.cookies.delete('org');
  const response = NextResponse.next({ request });
  response.cookies.delete('org');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
