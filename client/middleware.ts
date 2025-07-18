import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function Middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
console.log('Middleware token:', token)
  // If no token, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Otherwise continue
  return NextResponse.next()
  
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/dashboard/:path*"], // add more paths as needed
};
