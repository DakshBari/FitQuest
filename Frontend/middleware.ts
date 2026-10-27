import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define protected routes (requires login)
const protectedRoutes = [
  '/dashboard', 
  '/kitchen', 
  '/arena', 
  '/sanctuary', 
  '/world-map', 
  '/guilds', 
  '/profile', 
  '/settings'
]

// Define public auth routes (login/signup)
const authRoutes = ['/login', '/signup']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Validate that token exists and is not a corrupted "undefined" or "null" string
  const rawToken = request.cookies.get('token')?.value || 
                   request.headers.get('authorization')?.replace('Bearer ', '')
  const isValidToken = Boolean(
    rawToken && 
    rawToken !== 'undefined' && 
    rawToken !== 'null' && 
    rawToken.trim().length > 10
  )
  
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.includes(pathname)
  
  // 1. If accessing a protected route WITHOUT a valid token -> Redirect to Login
  if (isProtectedRoute && !isValidToken) {
    const loginUrl = new URL('/login', request.url)
    const response = NextResponse.redirect(loginUrl)
    // Clear corrupted/empty token cookie to prevent loops
    if (rawToken && !isValidToken) {
      response.cookies.delete('token')
    }
    return response
  }
  
  // 2. If accessing Login/Signup page AND has a valid token -> Only redirect to Dashboard
  // if NOT explicitly redirected back by the client (prevents client-server ping-pong loops)
  if (isAuthRoute && isValidToken && !request.nextUrl.searchParams.has('redirect')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  return NextResponse.next()
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
}