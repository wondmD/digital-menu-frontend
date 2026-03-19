"use client"

import { useEffect } from "react"
import { useSession, signOut } from "next-auth/react"

export function SessionWatcher() {
  const { data: session } = useSession()

  useEffect(() => {
    const authError = (session?.user as any)?.error
    if (authError === "SessionExpired" || authError === "RefreshAccessTokenError") {
      signOut({ callbackUrl: "/login" })
    }
  }, [session])

  return null
}
