import { type NextAuthOptions } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { apiFetch } from "@/lib/api-client"

const ONE_DAY_SECONDS = 24 * 60 * 60
const REMEMBER_ME_SECONDS = 30 * ONE_DAY_SECONDS
const DEFAULT_SESSION_SECONDS = ONE_DAY_SECONDS

function decodeAccessTokenExpiryMillis(accessToken: string): number | null {
  try {
    const parts = accessToken.split(".")
    if (parts.length < 2) return null

    // JWT uses base64url; convert to standard base64 for decoding.
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = Buffer.from(base64, "base64").toString()
    const payload = JSON.parse(jsonPayload)
    if (typeof payload?.exp === "number") return payload.exp * 1000
  } catch {
    // Ignore decoding failures and fall back to a safe default.
  }
  return null
}

function getAccessAndRefreshTokens(data: any): { accessToken?: string; refreshToken?: string } {
  // Backend responses may be nested and/or use different key casing.
  const container = data?.data || data
  return {
    accessToken: container?.access_token || container?.accessToken,
    refreshToken: container?.refresh_token || container?.refreshToken,
  }
}

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
          const remember = credentials.remember === "true"
          const data = await apiFetch<{ data: { access_token: string; refresh_token?: string; user: any } }>("/auth/login", {
            method: "POST",
            body: {
              email: credentials.email,
              password: credentials.password,
              // Backend may use this to decide whether to return/extend refresh tokens.
              remember,
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
            role: user?.role,
            remember,
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
        token.role = u.role
        token.remember = remember
        token.refreshFailureCount = 0
        token.sessionExpiresAt = now + (remember ? REMEMBER_ME_SECONDS : DEFAULT_SESSION_SECONDS) * 1000
        
        // Decode expiry from token if possible
        token.accessTokenExpires =
          decodeAccessTokenExpiryMillis(u.accessToken) ?? Date.now() + 15 * 60 * 1000

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

        const { accessToken: newAccessToken, refreshToken: rotatedRefreshToken } = getAccessAndRefreshTokens(response)
        const newRefreshToken = rotatedRefreshToken || token.refreshToken // Reuse if backend didn't rotate.
        
        if (!newAccessToken) {
          throw new Error("Backend did not return a new access token")
        }

        // Decode new expiry
        let newExpiry = now + 15 * 60 * 1000 // default 15m
        newExpiry = decodeAccessTokenExpiryMillis(newAccessToken) ?? newExpiry

        return {
          ...token,
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          accessTokenExpires: newExpiry,
          refreshFailureCount: 0,
          // Sliding session for "remember me" to avoid sudden logout.
          // If the user keeps successfully refreshing, extend the session window.
          sessionExpiresAt: token.remember
            ? Date.now() + REMEMBER_ME_SECONDS * 1000
            : token.sessionExpiresAt,
          error: undefined,
        }
      } catch (error) {
        const nextFailureCount = Number(token.refreshFailureCount || 0) + 1
        const forceSignOutThreshold = token.remember ? 6 : 3
        const shouldForceSignOut = !token.remember || nextFailureCount >= forceSignOutThreshold
        
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
        ;(session.user as any).role = token.role
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
