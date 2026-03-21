import { LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type SummaryCardProps = {
  label: string
  value: string
  icon: LucideIcon
  helper?: string
}

export function SummaryCard({ label, value, icon: Icon, helper }: SummaryCardProps) {
  return (
    <Card className="border-border/60 bg-card/60">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
          <span>{label}</span>
          <Icon className="h-4 w-4" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        {helper ? <p className="mt-1 text-xs text-muted-foreground">{helper}</p> : null}
      </CardContent>
    </Card>
  )
}
