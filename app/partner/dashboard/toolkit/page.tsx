"use client"

import { useEffect, useMemo, useState } from "react"
import { Copy, Download, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { fetchPartnerOverview, fetchPartnerToolkit } from "@/lib/partner-api"
import { usePartnerSession } from "@/components/partner/use-partner-session"

export default function PartnerToolkitPage() {
  const { partnerId, referralCode } = usePartnerSession()
  const [assets, setAssets] = useState<any[]>([])
  const [level, setLevel] = useState("Starter")
  const [progress, setProgress] = useState(0)
  const [target, setTarget] = useState(6)
  const [currentReferralCode, setCurrentReferralCode] = useState("")

  useEffect(() => {
    if (!partnerId) return

    Promise.all([fetchPartnerToolkit(partnerId), fetchPartnerOverview(partnerId)]).then(([toolkit, overview]) => {
      setAssets(toolkit)
      setLevel(overview.level)
      setProgress(overview.progress)
      setTarget(overview.nextLevelTarget)
      setCurrentReferralCode(overview.referralCode || "")
    })
  }, [partnerId])

  const referralLink = useMemo(() => {
    const code = currentReferralCode || referralCode || partnerId
    if (!code) return ""
    const path = `/register?marketer_referral_code=${encodeURIComponent(code)}&campaign=partner_program`
    if (typeof window === "undefined") return path
    return `${window.location.origin}${path}`
  }, [currentReferralCode, referralCode, partnerId])

  return (
    <div className="space-y-6">
      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Star className="h-5 w-5" /> Partner Level System
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>Current Level: <strong>{level}</strong></span>
            <Badge variant="outline">Next target: {target} total referrals</Badge>
          </div>
          <Progress value={progress} />
          <p className="text-xs text-muted-foreground">Starter (0-5), Pro (6-20), Elite (20+)</p>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle className="text-lg">Marketing Toolkit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {assets.map((asset) => (
            <div key={asset.id} className="flex flex-col gap-3 rounded-md border border-border/60 p-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold">{asset.title}</p>
                <p className="text-xs text-muted-foreground">{asset.description}</p>
              </div>
              <Button asChild variant="outline">
                <a href={asset.url} download>
                  <Download className="mr-2 h-4 w-4" /> Download
                </a>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle className="text-lg">Quick Share</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex-1 rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm">{referralLink}</div>
          <Button onClick={() => navigator.clipboard.writeText(referralLink)}>
            <Copy className="mr-2 h-4 w-4" /> Copy Referral Link
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
