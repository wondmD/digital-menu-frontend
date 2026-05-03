import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

const PUBLIC_CACHE_CONTROL = "public, s-maxage=300, stale-while-revalidate=86400"

function isPublicMenuRoute(pathname: string): boolean {
  if (pathname === "/") return true
  if (pathname.startsWith("/menu/")) return true
  if (pathname.startsWith("/app/") || pathname.startsWith("/dashboard/") || pathname.startsWith("/admin/") || pathname.startsWith("/api/")) {
    return false
  }

  const segments = pathname.split("/").filter(Boolean)
  if (segments.length === 1) {
    const reservedTopLevel = new Set([
      "login",
      "register",
      "forgot-password",
      "reset-password",
      "verify-email",
      "packages",
      "payment",
      "demo",
      "activate",
      "partner",
    ])
    return !reservedTopLevel.has(segments[0])
  }
  if (segments.length === 2 && segments[1] === "list") return true
  return false
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl
  const isLoginRoute = pathname === "/login"

  if (isLoginRoute) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.next()
    }

    const role = String((token as any)?.role || "").toLowerCase()
    const isAdmin = role === "admin"
    return NextResponse.redirect(new URL(isAdmin ? "/admin" : "/dashboard", req.url))
  }

  if (isPublicMenuRoute(pathname)) {
    const response = NextResponse.next()
    response.headers.set("Cache-Control", PUBLIC_CACHE_CONTROL)
    return response
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  if (!token) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`)
    return NextResponse.redirect(loginUrl)
  }

  const role = String((token as any)?.role || "").toLowerCase()
  const isAdmin = role === "admin"

  if (pathname.startsWith("/admin") && !isAdmin) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  if (isAdmin && (pathname.startsWith("/dashboard") || pathname.startsWith("/app"))) {
    return NextResponse.redirect(new URL("/admin", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/app/:path*", "/admin/:path*", "/login"],
}
