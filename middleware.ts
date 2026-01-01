import { withAuth } from "next-auth/middleware"

// Protect dashboard/app routes with NextAuth session
export default withAuth({
  pages: {
    signIn: "/login",
  },
})

export const config = {
  matcher: ["/dashboard/:path*", "/app/:path*"],
}
