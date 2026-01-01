import NextAuth, { type NextAuthOptions } from "next-auth"
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

        const data = await apiFetch<{ data: { access_token: string; user: any } }>(
          "/api/v1/auth/login",
          {
            method: "POST",
            body: {
              email: credentials.email,
              password: credentials.password,
            },
          },
        )

        if (!data?.data?.access_token) return null

        return {
          id: data.data.user?.id || credentials.email,
          email: credentials.email,
          name: `${data.data.user?.first_name || ""} ${data.data.user?.last_name || ""}`.trim(),
          accessToken: data.data.access_token,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).accessToken
      }
      return token
    },
    async session({ session, token }) {
      if (token?.accessToken && session.user) {
        ;(session.user as any).accessToken = token.accessToken
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
