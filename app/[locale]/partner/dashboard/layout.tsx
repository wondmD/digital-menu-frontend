"use client"

import { ReactNode, useEffect, useState } from "react"
import { PartnerSidebar } from "@/components/partner/partner-sidebar"
import { usePartnerSession } from "@/components/partner/use-partner-session"
import { fetchPartnerProfile } from "@/lib/partner-api"

export default function PartnerDashboardLayout({ children }: { children: ReactNode }) {
  const { partnerId, username, isLoading } = usePartnerSession()
  const [name, setName] = useState("Partner")

  useEffect(() => {
    if (!partnerId) return
    fetchPartnerProfile(partnerId).then((profile) => setName(profile.fullName))
  }, [partnerId])

  useEffect(() => {
    if (username) setName(username)
  }, [username])

  if (isLoading || !partnerId) {
    return (
      <div className="min-h-screen p-8">
        <p className="text-sm text-muted-foreground">Checking partner session...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen lg:flex">
      <PartnerSidebar />
      <main className="flex-1 p-4 md:p-8">
        <div className="mb-6 rounded-lg border border-border/60 bg-card/60 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Welcome back</p>
          <h1 className="text-xl font-semibold">{name}</h1>
        </div>
        {children}
      </main>
    </div>
  )
}
