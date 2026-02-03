import { type NextAuthOptions } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { apiFetch } from "@/lib/api-client"

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const data = await apiFetch<{ data: { access_token: string; refresh_token?: string; user: any } }>("/auth/login", {
            method: "POST",
            body: {
              email: credentials.email,
              password: credentials.password,
            },
          })

          if (!data?.data?.access_token) return null

          const user = data.data.user
          return {
            id: user?.id || credentials.email,
            email: credentials.email,
            name: `${user?.first_name || ""} ${user?.last_name || ""}`.trim(),
            accessToken: data.data.access_token,
            refreshToken: data.data.refresh_token,
            remember: credentials.remember === "true",
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Invalid credentials"
          throw new Error(message || "Invalid credentials")
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      // 1. Initial login - populate JWT with user data
      if (user) {
        const u = user as any
        token.accessToken = u.accessToken
        token.refreshToken = u.refreshToken
        token.remember = u.remember
        
        // Decode expiry from token if possible
        try {
          const payload = JSON.parse(Buffer.from(u.accessToken.split('.')[1], 'base64').toString())
          token.accessTokenExpires = payload.exp * 1000
        } catch (e) {
          // If decoding fails, set a default 15 mins
          token.accessTokenExpires = Date.now() + 15 * 60 * 1000
        }

        return token
      }

      // 2. Check if token is still valid (with a 2-minute safety buffer)
      const safetyBuffer = 2 * 60 * 1000
      const now = Date.now()
      
      if (token.accessTokenExpires && now < (token.accessTokenExpires as number) - safetyBuffer) {
        return token
      }

      // 3. Access token has expired, try to refresh it
      console.log("[Auth] Access token expired, attempting refresh...")

      try {
        if (!token.refreshToken) {
          throw new Error("No refresh token available")
        }

        const response = await apiFetch<any>("/auth/refresh", {
          method: "POST",
          body: {
            refresh_token: token.refreshToken,
          },
        })

        // Backend might return nested data or flat
        const resData = response?.data || response
        const newAccessToken = resData.access_token
        const newRefreshToken = resData.refresh_token || token.refreshToken // Reuse if not rotated
        
        if (!newAccessToken) {
          throw new Error("Backend did not return a new access token")
        }

        // Decode new expiry
        let newExpiry = now + 15 * 60 * 1000 // default 15m
        try {
          const payload = JSON.parse(Buffer.from(newAccessToken.split('.')[1], 'base64').toString())
          if (payload.exp) newExpiry = payload.exp * 1000
        } catch (e) {}

        console.log("[Auth] Token refreshed successfully")
        
        return {
          ...token,
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          accessTokenExpires: newExpiry,
        }
      } catch (error) {
        console.error("[Auth] RefreshAccessTokenError:", error)
        
        return {
          ...token,
          error: "RefreshAccessTokenError",
        }
      }
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).accessToken = token.accessToken
        ;(session.user as any).refreshToken = token.refreshToken
        ;(session.user as any).error = token.error
        ;(session.user as any).remember = token.remember
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
}
