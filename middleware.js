import { NextResponse } from 'next/server'
import { verifyToken } from './lib/auth'

export async function middleware(request) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/admin/login') || pathname.startsWith('/staff-login')) return NextResponse.next()

  const token = request.cookies.get('admin_session')?.value
  const payload = token ? await verifyToken(token) : null

  if (!payload) {
    const url = request.nextUrl.clone()
    url.pathname = '/staff-login'
    return NextResponse.redirect(url)
  }

  // Drivers get the deliveries screen only; they have no business in the
  // dashboard, and sending them there would just show a wall of controls.
  if (payload.role === 'driver' && pathname.startsWith('/admin')) {
    const url = request.nextUrl.clone()
    url.pathname = '/driver'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/driver/:path*'],
}
