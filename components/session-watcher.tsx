"use client"

import { useEffect } from "react"
import { useSession, signOut } from "next-auth/react"

export function SessionWatcher() {
  const { data: session } = useSession()

  useEffect(() => {
    if ((session?.user as any)?.error === "RefreshAccessTokenError") {
      signOut({ callbackUrl: "/login" })
    }
  }, [session])

  return null
}
