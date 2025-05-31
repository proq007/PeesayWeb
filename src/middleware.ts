// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/signup']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get('token')?.value

  // If it's a public route (login/signup)
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname)

  // 1) Unauthenticated users: any non-public route → /login
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // 2) Authenticated users: trying to hit public routes → /dashboard
  if (token && isPublicRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // 3) Otherwise just continue
  return NextResponse.next()
}

export const config = {
  // apply middleware to **all** paths
 matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
