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
      <AppSidebar>
        <div className="dashboard-readable dashboard-surface-polish w-full min-w-0 overflow-x-hidden">{children}</div>
      </AppSidebar>
    </SubscriptionWatcher>
  )
}
