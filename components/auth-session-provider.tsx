"use client"

import { SessionProvider } from "next-auth/react"
import type { Session } from "next-auth"
import type { ReactNode } from "react"
import { SessionWatcher } from "./session-watcher"

export function AuthSessionProvider({ children, session }: { children: ReactNode; session?: Session }) {
  return (
    <SessionProvider 
      session={session} 
      refetchInterval={5 * 60} // Refetch session every 5 minutes
      refetchOnWindowFocus={true}
    >
      <SessionWatcher />
      {children}
    </SessionProvider>
  )
}
