import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl
  const isLoginRoute = pathname === "/login"
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  if (!token) {
    if (isLoginRoute) return NextResponse.next()
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`)
    return NextResponse.redirect(loginUrl)
  }

  const role = String((token as any)?.role || "").toLowerCase()
  const isAdmin = role === "admin"

  if (pathname.startsWith("/admin") && !isAdmin) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  if (isLoginRoute) {
    return NextResponse.redirect(new URL(isAdmin ? "/admin" : "/dashboard", req.url))
  }

  if (isAdmin && (pathname.startsWith("/dashboard") || pathname.startsWith("/app"))) {
    return NextResponse.redirect(new URL("/admin", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/app/:path*", "/admin/:path*", "/login"],
}
