"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, FormEvent } from "react"
import { Coffee } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

export default function RegisterPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const fullName = formData.get("full_name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const phone = formData.get("phone") as string

    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName.trim(),
          role: "owner",
          phone,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        const message = data?.error || data?.message || "Could not register with those details."
        const raw = data?.raw ? ` | raw: ${data.raw}` : ""
        throw new Error(`${message}${data?.status ? ` (status ${data.status})` : ""}${raw}`)
      }

      toast({ title: "Account created", description: "Welcome to MenuVista!" })

      toast({
        title: "Check your email",
        description: "We sent a verification link. Activate your account to sign in.",
      })

      router.push(`/verify-email?email=${encodeURIComponent(email)}`)
    } catch (err: any) {
      toast({
        title: "Could not register",
        description: err?.message || "Please check your details and try again.",
        variant: "destructive",
      })
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
          <CardTitle className="text-3xl font-serif text-primary tracking-tight">Join MenuQR</CardTitle>
          <CardDescription className="text-muted-foreground/80 font-medium">
            Start your journey toward a digital, fresh menu experience
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input id="full_name" name="full_name" placeholder="John Doe" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email" className="font-medium">
                Work Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="manager@greenleaf.com"
                className="bg-white/50 border-primary/10"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" className="bg-white/50 border-primary/10" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+1234567890"
                className="bg-white/50 border-primary/10"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-lg font-medium mt-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98]"
            >
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-center gap-1 text-sm text-muted-foreground">
          Already a partner?{" "}
          <Link
            href="/login"
            className="text-primary font-semibold hover:text-primary/80 transition-colors underline-offset-4 hover:underline"
          >
            Login here
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
