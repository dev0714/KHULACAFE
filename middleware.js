import { NextResponse } from 'next/server'
import { verifyToken } from './lib/auth'

export async function middleware(request) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/admin/login')) return NextResponse.next()

  const token = request.cookies.get('admin_session')?.value
  const payload = token ? await verifyToken(token) : null

  if (!payload) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
