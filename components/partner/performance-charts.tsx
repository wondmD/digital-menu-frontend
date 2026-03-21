"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PartnerAnalyticsPoint } from "@/lib/mock-data"
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

type PerformanceChartsProps = {
  points: PartnerAnalyticsPoint[]
}

export function PerformanceCharts({ points }: PerformanceChartsProps) {
  return (
    <Card className="border-border/60 bg-card/60">
      <CardHeader>
        <CardTitle className="text-lg">Signups and Conversions Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-75 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="signups" stroke="#2563eb" strokeWidth={2} />
              <Line type="monotone" dataKey="conversions" stroke="#16a34a" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
