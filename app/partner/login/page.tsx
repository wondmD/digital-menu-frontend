"use client"

import { Suspense } from "react"
import { FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { apiFetch } from "@/lib/api-client"
import { savePartnerSession } from "@/lib/partner-auth"
import { useToast } from "@/components/ui/use-toast"

function PartnerLoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      setLoading(true)
      const response = await apiFetch<any>("/auth/login", {
        method: "POST",
        body: {
          email: email.trim(),
          password,
        },
      })

      const data = response?.data || response
      const user = data?.user || {}
      const role = String(user?.role || "").toLowerCase()

      if (role && role !== "partner") {
        throw new Error("This account is not a partner account.")
      }

      const accessToken = String(data?.access_token || "")
      if (!accessToken) {
        throw new Error("Login response did not include an access token.")
      }

      const partnerId = String(user?.id || user?.partner_id || `partner_${email.split("@")[0]}`)
      const username = String(user?.username || user?.full_name || user?.name || email.split("@")[0])

      savePartnerSession({
        partnerId,
        username,
        accessToken,
        refreshToken: data?.refresh_token,
        referralCode: user?.referral_code || user?.marketer_referral_code,
        email: user?.email || email,
      })

      const next = params.get("next") || "/partner/dashboard/overview"
      router.replace(next)
    } catch (err: any) {
      toast({
        title: "Partner login failed",
        description: err?.message || "Invalid credentials or account type.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
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
              <label className="text-sm font-medium">Partner Email</label>
              <Input
                placeholder="partner@company.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                placeholder="Enter password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Partner access is provisioned by admin.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PartnerLoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">Loading...</div>}>
      <PartnerLoginForm />
    </Suspense>
  )
}
