import React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SubscriptionWatcher } from "@/components/subscription-watcher"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SubscriptionWatcher>
      <AppSidebar>{children}</AppSidebar>
    </SubscriptionWatcher>
  )
}
