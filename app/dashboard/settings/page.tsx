"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { ShieldCheck, UserRound } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { apiFetch } from "@/lib/api-client"

interface Profile {
  id: string
  email: string
  full_name: string
  phone?: string
  role?: string
  is_active?: boolean
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const token = (session?.user as any)?.accessToken as string | undefined
  const { toast } = useToast()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const ready = status === "authenticated" && !!token

  useEffect(() => {
    if (!ready) return
    const load = async () => {
      try {
        setLoading(true)
        const res = await apiFetch<{ data: Profile }>("/auth/me", { token })
        const data = res?.data
        if (data) {
          setProfile(data)
          setFullName(data.full_name || session?.user?.name || "")
          setPhone(data.phone || "")
        } else {
          setFullName(session?.user?.name || "")
          setPhone("")
        }
      } catch (err: any) {
        toast({ title: "Could not load profile", description: err?.message, variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [ready, token, toast, session?.user?.name])

  const handleSave = async () => {
    if (!ready) return
    try {
      setSaving(true)
      await apiFetch("/auth/me", {
        method: "PATCH",
        token,
        body: {
          full_name: fullName.trim(),
          phone: phone.trim(),
        },
      })
      setProfile((prev) =>
        prev
          ? { ...prev, full_name: fullName.trim(), phone: phone.trim() }
          : {
              id: "",
              email: session?.user?.email || "",
              full_name: fullName.trim(),
              phone: phone.trim(),
              role: undefined,
              is_active: undefined,
            },
      )
      toast({ title: "Profile updated", description: "Your account details were saved." })
    } catch (err: any) {
      toast({ title: "Could not save", description: err?.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (!ready) {
    return <p className="text-sm text-muted-foreground">Sign in to view your profile settings.</p>
  }

  const email = profile?.email || session?.user?.email || "—"
  const role = profile?.role || (session?.user as any)?.role || "owner"
  const isActive = profile?.is_active ?? true

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Account settings</h1>
          <p className="text-muted-foreground">Manage your personal details and contact information.</p>
        </div>
        <Badge variant={isActive ? "secondary" : "outline"} className="flex items-center gap-1">
          <ShieldCheck className="h-4 w-4" />
          {isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      <Card className="border-primary/10 shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <UserRound className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>Your identity and how we contact you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input
                id="full_name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={email} disabled className="bg-muted/50" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input id="role" value={role} disabled className="bg-muted/50" />
            </div>
          </div>

          <Separator />

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving || loading || !fullName.trim()}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
