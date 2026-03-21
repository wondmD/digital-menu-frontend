"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { savePartnerSession } from "@/lib/partner-auth"

export default function PartnerLoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const [partnerIdInput, setPartnerIdInput] = useState("")
  const [usernameInput, setUsernameInput] = useState("")
  const [loading, setLoading] = useState(false)

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const partnerId = partnerIdInput.trim() || "partner_9fd2"
    const username = usernameInput.trim() || "partner_user"
    setLoading(true)
    savePartnerSession(partnerId, username)
    const next = params.get("next") || "/partner/dashboard/overview"
    router.replace(next)
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md border-border/60 bg-card/70 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-2xl">Partner Login</CardTitle>
          <CardDescription>Sign in to your marketer account dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium">Partner ID</label>
              <Input
                placeholder="partner_9fd2"
                value={partnerIdInput}
                onChange={(e) => setPartnerIdInput(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <Input
                placeholder="partner_user"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                required
              />
            </div>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            New partner? <Link className="text-primary underline" href="/partner/register">Create an account</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
