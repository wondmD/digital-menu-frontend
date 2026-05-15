"use client"

import { useEffect, useMemo, useState } from "react"
import { Activity, Building2, DollarSign, Link2, Percent, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { NotificationFeed } from "@/components/partner/notification-feed"
import { OnboardingChecklist } from "@/components/partner/onboarding-checklist"
import { SummaryCard } from "@/components/partner/summary-card"
import {
  PartnerOverview,
  fetchPartnerChecklist,
  fetchPartnerNotifications,
  fetchPartnerOverview,
} from "@/lib/partner-api"
import { usePartnerSession } from "@/components/partner/use-partner-session"

export default function PartnerOverviewPage() {
  const { partnerId, referralCode } = usePartnerSession()
  const [overview, setOverview] = useState<PartnerOverview | null>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [checklist, setChecklist] = useState<any[]>([])

  useEffect(() => {
    if (!partnerId) return

    Promise.all([
      fetchPartnerOverview(partnerId),
      fetchPartnerNotifications(partnerId),
      fetchPartnerChecklist(partnerId),
    ]).then(([overviewData, notificationData, checklistData]) => {
      setOverview(overviewData)
      setNotifications(notificationData)
      setChecklist(checklistData)
    })
  }, [partnerId])

  const referralLink = useMemo(() => {
    const code = overview?.referralCode || referralCode || partnerId
    if (!code) return ""
    const path = `/register?marketer_referral_code=${encodeURIComponent(code)}&campaign=partner_program`
    if (typeof window === "undefined") return path
    return `${window.location.origin}${path}`
  }, [overview?.referralCode, referralCode, partnerId])

  if (!overview) {
    return <p className="text-sm text-muted-foreground">Loading overview...</p>
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard label="Total Referred" value={String(overview.totalRestaurantsReferred)} icon={Building2} />
        <SummaryCard label="Active Subscriptions" value={String(overview.activeSubscriptions)} icon={Activity} />
        <SummaryCard label="Total Earnings" value={`$${overview.totalEarnings.toLocaleString()}`} icon={DollarSign} />
        <SummaryCard label="Monthly Earnings" value={`$${overview.monthlyEarnings.toLocaleString()}`} icon={Wallet} />
        <SummaryCard label="Conversion Rate" value={`${overview.conversionRate}%`} icon={Percent} />
      </div>

      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle className="text-lg">Referral Link</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex-1 rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm">
            {referralLink}
          </div>
          <Button
            variant="outline"
            onClick={() => navigator.clipboard.writeText(referralLink)}
          >
            <Link2 className="mr-2 h-4 w-4" /> Copy Link
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <OnboardingChecklist items={checklist} />
        <NotificationFeed notifications={notifications} />
      </div>
    </div>
  )
}
