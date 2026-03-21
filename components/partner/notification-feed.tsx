import { Bell } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PartnerNotification } from "@/lib/mock-data"

type NotificationFeedProps = {
  notifications: PartnerNotification[]
}

export function NotificationFeed({ notifications }: NotificationFeedProps) {
  return (
    <Card className="border-border/60 bg-card/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="h-5 w-5" /> Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {notifications.map((item) => (
          <div key={item.id} className="rounded-md border border-border/60 p-3">
            <p className="text-sm font-semibold">{item.title}</p>
            <p className="text-xs text-muted-foreground">{item.description}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
