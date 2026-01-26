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

          return {
            id: data.data.user?.id || credentials.email,
            email: credentials.email,
            name: `${data.data.user?.first_name || ""} ${data.data.user?.last_name || ""}`.trim(),
            accessToken: data.data.access_token,
            refreshToken: data.data.refresh_token,
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
      if (user) {
        token.accessToken = (user as any).accessToken
        token.refreshToken = (user as any).refreshToken
        
        try {
          const payloadBase64 = token.accessToken.split('.')[1]
          if (payloadBase64) {
            const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString())
            if (payload.exp) {
              token.accessTokenExpires = payload.exp * 1000
            }
          }
        } catch (e) {
          console.error("Error decoding token expiry", e)
        }

        if (!token.accessTokenExpires) {
          const expiresIn = (user as any).expiresIn || 900 // 15 mins
          token.accessTokenExpires = Date.now() + expiresIn * 1000
        }
      }

      const safetyBuffer = 60 * 1000
      if (token.accessToken && Date.now() < (token.accessTokenExpires as number) - safetyBuffer) {
        return token
      }

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

        const access_token = response?.data?.access_token || response?.access_token
        const refresh_token = response?.data?.refresh_token || response?.refresh_token || token.refreshToken
        
        if (!access_token) {
          throw new Error("Failed to refresh access token")
        }

        let newExpiry: number | undefined
        try {
          const payloadBase64 = access_token.split('.')[1]
          if (payloadBase64) {
            const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString())
            if (payload.exp) {
              newExpiry = payload.exp * 1000
            }
          }
        } catch (e) {}

        return {
          ...token,
          accessToken: access_token,
          refreshToken: refresh_token,
          accessTokenExpires: newExpiry || (Date.now() + 900 * 1000),
        }
      } catch (error) {
        console.error("RefreshAccessTokenError:", error)
        return {
          ...token,
          error: "RefreshAccessTokenError",
        }
      }
    },
    async session({ session, token }) {
      if (token?.accessToken && session.user) {
        ;(session.user as any).accessToken = token.accessToken
        ;(session.user as any).error = token.error
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
}
