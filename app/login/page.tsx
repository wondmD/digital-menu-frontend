"use client"

import Link from "next/link"
import { signIn } from "next-auth/react"
import { Coffee } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { FormEvent, useState } from "react"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    setLoading(true)
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: true,
        callbackUrl: "/dashboard",
      })
      if (res?.error) {
        alert(res.error)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 p-4 font-sans relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-primary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <Card className="w-full max-w-md bg-white/80 backdrop-blur-md border-primary/10 shadow-xl relative z-10">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary border border-primary/20">
              <Coffee className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-3xl font-serif text-primary tracking-tight">Welcome back</CardTitle>
          <CardDescription className="text-muted-foreground/80 font-medium">
            Enter your credentials to manage your digital oasis
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <form className="grid gap-5" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="owner@hotel.com" required />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="#" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-lg font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98]"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-center gap-1 text-sm text-muted-foreground pt-2">
          New here?{" "}
          <Link
            href="/register"
            className="text-primary font-semibold hover:text-primary/80 transition-colors underline-offset-4 hover:underline"
          >
            Create an establishment account
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
