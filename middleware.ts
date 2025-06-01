import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const protectedRoutes = ['/', '/api/questions', '/questions'];
const authRoutes = ['/auth/login', '/auth/signup'];
const publicApiRoutes = [
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/recover',
  '/api/auth/set-token',
  '/api/demo-questions',
  '/api/demo-pdf-proxy',
  '/api/proxy-pdf'
];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Skip middleware for public API routes
  if (publicApiRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Handle APIs
  if (pathname.startsWith('/api') && !token) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // If trying to access other protected routes without token
  if (protectedRoutes.includes(pathname) && !token) {
    const loginUrl = new URL('/auth/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If trying to access auth route while authenticated
  if (authRoutes.includes(pathname) && token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const homeUrl = new URL('/', request.url);
      return NextResponse.redirect(homeUrl);
    } catch (error) {
      // Invalid token, clear it and allow access
      const response = NextResponse.next();
      response.cookies.delete('token');
      return response;
    }
  }

  return NextResponse.next();
}