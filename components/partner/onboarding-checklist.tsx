import { CheckCircle2, Circle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { PartnerChecklistItem } from "@/lib/mock-data"

type OnboardingChecklistProps = {
  items: PartnerChecklistItem[]
}

export function OnboardingChecklist({ items }: OnboardingChecklistProps) {
  const completed = items.filter((item) => item.completed).length
  const progress = items.length ? Math.round((completed / items.length) * 100) : 0

  return (
    <Card className="border-border/60 bg-card/60">
      <CardHeader>
        <CardTitle className="text-lg">Onboarding Checklist</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{completed} of {items.length} completed</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>

        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-2 rounded-md border border-border/60 px-3 py-2 text-sm">
              {item.completed ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
              <span>{item.title}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
