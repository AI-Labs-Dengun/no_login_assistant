import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const theme = request.cookies.get('theme')?.value;
  const response = NextResponse.next();

  // Set the theme header based on the cookie
  if (theme === 'dark') {
    response.headers.set('x-theme', 'dark');
  } else {
    response.headers.set('x-theme', 'light');
  }

  return response;
}

// Configure the middleware to run on all routes
export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
}; 