import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'chave_super_secreta_paroquia_dev'
);

const publicRoutes = ['/login', '/cadastro'];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow API routes (handled separately or public like login/register)
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value;

  // Protect private routes
  if (!publicRoutes.includes(pathname) && pathname !== '/') {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    try {
      await jwtVerify(token, JWT_SECRET);
      
      // If admin route, we could optionally decode role here, but keeping it simple
      // we'll protect admin actions in API routes as well
    } catch (error) {
      // Invalid token
      request.cookies.delete('token');
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect authenticated users away from public routes (login/register to dashboard)
  if (publicRoutes.includes(pathname) && token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch (error) {
      // Ignored
    }
  }

  // Redirect root to dashboard (which will redirect to login if no token)
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
