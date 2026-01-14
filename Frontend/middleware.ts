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
  
  // FIX 1: Check for cookie named 'token' (matches AuthContext)
  const token = request.cookies.get('token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '')
  
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.includes(pathname)
  
  // 1. If accessing a protected route WITHOUT a token -> Redirect to Login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url)
    // Optional: Keep the URL they tried to visit so they go back after login
    // loginUrl.searchParams.set('redirect', pathname) 
    return NextResponse.redirect(loginUrl)
  }
  
  // FIX 2: If accessing Login/Signup page AND token exists -> Redirect to Dashboard
  // We check isAuthRoute AND token separately to avoid operator precedence bugs
  if (isAuthRoute && token) {
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