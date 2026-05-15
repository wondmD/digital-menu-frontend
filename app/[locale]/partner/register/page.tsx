"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PartnerRegisterPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md border-border/60 bg-card/70 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-2xl">Partner Signup Disabled</CardTitle>
          <CardDescription>Partner accounts are created by admins only.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Contact your system administrator to provision a partner account, referral code, and payout settings.
          </p>
          <Button className="w-full" asChild>
            <Link href="/partner/login">Go to Partner Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
