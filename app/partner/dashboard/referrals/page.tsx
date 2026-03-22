"use client"

import { useEffect, useMemo, useState } from "react"
import { Copy, Link2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchPartnerReferrals } from "@/lib/partner-api"
import { usePartnerSession } from "@/components/partner/use-partner-session"

function statusVariant(status: string): "secondary" | "outline" | "destructive" {
  if (status === "active") return "secondary"
  if (status === "pending") return "outline"
  return "destructive"
}

function prettySubscriptionStatus(value: string): string {
  const v = String(value || "").trim().toLowerCase()
  if (v === "past_due") return "Past Due"
  if (v === "canceled") return "Canceled"
  if (v === "active") return "Active"
  if (v === "trial") return "Trial"
  return v ? v.replace(/_/g, " ") : "-"
}

function formatJoinedDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleDateString()
}

export default function PartnerReferralsPage() {
  const { partnerId, referralCode } = usePartnerSession()
  const [rows, setRows] = useState<any[]>([])

  useEffect(() => {
    if (!partnerId) return
    fetchPartnerReferrals(partnerId).then(setRows)
  }, [partnerId])

  const referralLink = useMemo(() => {
    const code = referralCode || partnerId
    if (!code) return ""
    const path = `/register?marketer_referral_code=${encodeURIComponent(code)}&campaign=partner_program`
    if (typeof window === "undefined") return path
    return `${window.location.origin}${path}`
  }, [referralCode, partnerId])

  return (
    <div className="space-y-6">
      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle className="text-lg">Your Referral Link</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex-1 rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm">
            {referralLink}
          </div>
          <Button variant="outline" onClick={() => navigator.clipboard.writeText(referralLink)}>
            <Copy className="mr-2 h-4 w-4" /> Copy
          </Button>
          <Button>
            <Link2 className="mr-2 h-4 w-4" /> Share
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle className="text-lg">Referred Restaurants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto rounded-md border border-border/60">
            <table className="w-full min-w-185 text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="p-3">Restaurant</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Joined</th>
                  <th className="p-3">Subscription</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-border/40">
                    <td className="p-3 font-medium">{row.restaurantName}</td>
                    <td className="p-3">
                      <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">{formatJoinedDate(row.joinedAt)}</td>
                    <td className="p-3">{prettySubscriptionStatus(row.subscriptionStatus)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
