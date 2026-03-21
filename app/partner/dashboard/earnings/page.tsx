"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchPartnerCommissions } from "@/lib/partner-api"
import { usePartnerSession } from "@/components/partner/use-partner-session"

export default function PartnerEarningsPage() {
  const { partnerId } = usePartnerSession()
  const [rows, setRows] = useState<any[]>([])

  useEffect(() => {
    if (!partnerId) return
    fetchPartnerCommissions(partnerId).then(setRows)
  }, [partnerId])

  const totals = useMemo(() => {
    const first = rows.reduce((sum, row) => sum + row.firstPaymentCommission, 0)
    const recurring = rows.reduce((sum, row) => sum + row.recurringCommission, 0)
    const total = first + recurring
    return { first, recurring, total }
  }, [rows])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/60 bg-card/60">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">First Payment Commission (40%)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${totals.first.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/60">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Recurring Commission (10%)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${totals.recurring.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/60">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${totals.total.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle className="text-lg">Commission Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto rounded-md border border-border/60">
            <table className="w-full min-w-190 text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="p-3">Restaurant</th>
                  <th className="p-3">First Payment (40%)</th>
                  <th className="p-3">Recurring (10%)</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-border/40">
                    <td className="p-3 font-medium">{row.restaurantName}</td>
                    <td className="p-3">${row.firstPaymentCommission.toLocaleString()}</td>
                    <td className="p-3">${row.recurringCommission.toLocaleString()}</td>
                    <td className="p-3">
                      <Badge variant={row.status === "paid" ? "secondary" : "outline"}>{row.status}</Badge>
                    </td>
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
