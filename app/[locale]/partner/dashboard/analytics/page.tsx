"use client"

import { useEffect, useState } from "react"
import { BarChart3, Percent, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PerformanceCharts } from "@/components/partner/performance-charts"
import { fetchPartnerAnalytics, fetchPartnerOverview } from "@/lib/partner-api"
import { usePartnerSession } from "@/components/partner/use-partner-session"

export default function PartnerAnalyticsPage() {
  const { partnerId } = usePartnerSession()
  const [points, setPoints] = useState<any[]>([])
  const [conversionRate, setConversionRate] = useState(0)
  const [avgRevenue, setAvgRevenue] = useState(0)

  useEffect(() => {
    if (!partnerId) return

    Promise.all([fetchPartnerAnalytics(partnerId), fetchPartnerOverview(partnerId)]).then(([chart, overview]) => {
      setPoints(chart)
      setConversionRate(overview.conversionRate)
      setAvgRevenue(overview.avgRevenuePerRestaurant)
    })
  }, [partnerId])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/60 bg-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <Percent className="h-4 w-4" /> Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{conversionRate}%</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" /> Avg Revenue / Restaurant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${avgRevenue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <BarChart3 className="h-4 w-4" /> Reporting Window
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Last 6 Months</p>
          </CardContent>
        </Card>
      </div>

      <PerformanceCharts points={points} />
    </div>
  )
}
