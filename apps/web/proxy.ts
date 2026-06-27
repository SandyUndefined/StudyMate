import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require authentication
const PROTECTED_PREFIXES = ['/journal', '/mood', '/chat', '/dashboard']

// Routes only for unauthenticated users (redirect to /journal if logged in)
const AUTH_ONLY_ROUTES = ['/auth/login', '/auth/register']

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl

  // Check for the refresh token cookie — its presence signals a live session.
  // The actual JWT verification happens on the API; here we only gate navigation.
  const hasSession = request.cookies.has('refresh_token')

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  const isAuthRoute = AUTH_ONLY_ROUTES.some((r) => pathname === r)

  if (isProtected && !hasSession) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL('/journal', request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Match all routes except static assets and Next.js internals
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/).*)'],
}
