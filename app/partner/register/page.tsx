"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { savePartnerSession } from "@/lib/partner-auth"

function toPartnerId(name: string): string {
  const clean = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")
  return `partner_${clean || "new"}`
}

export default function PartnerRegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    const normalizedUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "")
    savePartnerSession(toPartnerId(normalizedUsername || fullName || email || "new"), normalizedUsername || "partner_user")
    router.replace("/partner/dashboard/overview")
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md border-border/60 bg-card/70 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-2xl">Partner Registration</CardTitle>
          <CardDescription>Create your marketer account to start earning commissions.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input placeholder="Selam Marketing Group" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <Input
                placeholder="selam_partner"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" placeholder="partners@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Create Partner Account"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account? <Link className="text-primary underline" href="/partner/login">Login</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
