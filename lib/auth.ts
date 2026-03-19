import { type NextAuthOptions } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { apiFetch } from "@/lib/api-client"

const ONE_DAY_SECONDS = 24 * 60 * 60
const REMEMBER_ME_SECONDS = 30 * ONE_DAY_SECONDS
const DEFAULT_SESSION_SECONDS = ONE_DAY_SECONDS

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        remember: { label: "Remember", type: "text" },
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
    maxAge: REMEMBER_ME_SECONDS,
  },
  callbacks: {
    async jwt({ token, user }) {
      // 1. Initial login - populate JWT with user data
      if (user) {
        const u = user as any
        const remember = Boolean(u.remember)
        const now = Date.now()
        token.accessToken = u.accessToken
        token.refreshToken = u.refreshToken
        token.remember = remember
        token.refreshFailureCount = 0
        token.sessionExpiresAt = now + (remember ? REMEMBER_ME_SECONDS : DEFAULT_SESSION_SECONDS) * 1000
        
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

      // Respect remember-me duration per device/session.
      if (token.sessionExpiresAt && now >= (token.sessionExpiresAt as number)) {
        return {
          ...token,
          error: "SessionExpired",
        }
      }
      
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
          refreshFailureCount: 0,
          error: undefined,
        }
      } catch (error) {
        console.error("[Auth] RefreshAccessTokenError:", error)
        const nextFailureCount = Number(token.refreshFailureCount || 0) + 1
        const shouldForceSignOut = !token.remember || nextFailureCount >= 3
        
        return {
          ...token,
          refreshFailureCount: nextFailureCount,
          error: shouldForceSignOut ? "RefreshAccessTokenError" : undefined,
        }
      }
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).accessToken = token.accessToken
        ;(session.user as any).refreshToken = token.refreshToken
        ;(session.user as any).error = token.error
        ;(session.user as any).remember = token.remember
        ;(session.user as any).refreshFailureCount = token.refreshFailureCount
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
}
