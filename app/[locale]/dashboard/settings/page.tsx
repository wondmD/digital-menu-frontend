"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { 
  Pencil, 
  Loader2
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { apiFetch } from "@/lib/api-client"

interface Profile {
  id: string
  email: string
  full_name: string
  phone?: string
  role?: string
  is_active?: boolean
  created_at?: string
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
  const [isEditing, setIsEditing] = useState(false)

  const ready = status === "authenticated" && !!token

  useEffect(() => {
    if (!ready) return
    const load = async () => {
      try {
        setLoading(true)
        
        // Load Profile
        const res = await apiFetch<{ data: Profile }>("/auth/me", { token })
        const data = res?.data
        if (data) {
          setProfile(data)
          setFullName(data.full_name || session?.user?.name || "")
          setPhone(data.phone || "")
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
      setIsEditing(false)
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
    <div className="max-w-6xl mx-auto space-y-12 md:space-y-16 pb-12 md:pb-24 px-3 sm:px-4 lg:px-0">
      {/* 1. OPERATIONAL CONTROL HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 pb-6 md:pb-8 border-b border-border/60">
        <div className="space-y-3 md:space-y-4">
          <Badge className="bg-primary/10 text-primary border border-primary/20 font-black text-[10px] uppercase tracking-[0.4em] px-5 py-2 rounded-full">
            Account configuration
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground uppercase">
            Account <span className="text-muted-foreground italic font-serif lowercase tracking-normal">settings</span>
          </h1>
          <p className="text-muted-foreground font-medium max-w-md text-base md:text-lg italic serif leading-relaxed">
            Manage your personal information and account details.
          </p>
        </div>
        
        {!isEditing && (
          <Button 
            onClick={() => setIsEditing(true)} 
            className="h-14 md:h-20 px-8 md:px-12 rounded-2xl md:rounded-[2rem] bg-primary text-white font-black uppercase text-xs tracking-[0.3em] hover:scale-105 transition-all shadow-[0_25px_50px_-12px_rgba(230,57,70,0.5)] w-full md:w-auto"
          >
            <Pencil className="h-5 w-5 mr-4" />
            Edit profile
          </Button>
        )}
      </div>

      <div className="space-y-12 md:space-y-16">
        <div className="space-y-12 md:space-y-16">
          <section className="space-y-8 md:space-y-10">
            <div className="flex items-center gap-4 px-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-muted-foreground">Profile information</h3>
            </div>

            {isEditing ? (
              <Card className="bg-card/40 backdrop-blur-3xl border-border/60 rounded-[2.5rem] md:rounded-[4rem] overflow-hidden border-2 shadow-3xl p-6 md:p-16 animate-in fade-in slide-in-from-bottom-6 duration-700">
                <div className="space-y-8 md:space-y-12">
                  <div className="grid gap-6 md:gap-10">
                    <div className="space-y-3 md:space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-1">Full Name</Label>
                      <Input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="h-14 md:h-16 rounded-xl md:rounded-2xl border-border/60 bg-muted/30 font-black px-6 md:px-8 text-lg md:text-xl text-foreground placeholder:text-muted-foreground/50 focus:border-primary/40 transition-all border-2"
                        placeholder="Abebe Kebede"
                        disabled={saving}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                       <div className="space-y-3 md:space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-1">Email address</Label>
                        <Input value={email} disabled className="h-14 md:h-16 rounded-xl md:rounded-2xl bg-muted/30 border-border/60 px-6 md:px-8 font-bold text-muted-foreground italic" />
                      </div>
                      <div className="space-y-3 md:space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-1">Phone number</Label>
                        <Input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="h-14 md:h-16 rounded-xl md:rounded-2xl border-border/60 bg-muted/30 font-black px-6 md:px-8 text-lg md:text-xl text-foreground placeholder:text-muted-foreground/50 focus:border-primary/40 transition-all border-2"
                          placeholder="+251912345678"
                          disabled={saving}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 pt-4 md:pt-6">
                    <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={saving} className="h-14 md:h-16 w-full sm:flex-1 rounded-xl md:rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                       Cancel
                    </Button>
                    <Button 
                      onClick={handleSave} 
                      disabled={saving || !fullName.trim()} 
                      className="h-14 md:h-16 w-full sm:flex-[2] rounded-xl md:rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-[0.3em] shadow-[0_20px_40px_-10px_rgba(230,57,70,0.4)] hover:scale-[1.02] transition-all"
                    >
                      {saving ? <Loader2 className="animate-spin h-5 w-5" /> : "Save changes"}
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Card className="p-4 rounded-2xl border border-border/60 bg-card/50">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Name</p>
                  <p className="mt-2 text-base font-bold text-foreground leading-tight">{profile?.full_name || "No name set"}</p>
                </Card>

                <Card className="p-4 rounded-2xl border border-border/60 bg-card/50">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Email</p>
                  <p className="mt-2 text-sm font-semibold text-foreground truncate">{email}</p>
                </Card>

                <Card className="p-4 rounded-2xl border border-border/60 bg-card/50">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Phone</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{profile?.phone || "—"}</p>
                </Card>

                <Card className="p-4 rounded-2xl border border-border/60 bg-card/50">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Role</p>
                  <p className="mt-2 text-sm font-semibold text-foreground capitalize">{role}</p>
                </Card>

                <Card className="p-4 rounded-2xl border border-border/60 bg-card/50">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Status</p>
                  <Badge className="mt-2 bg-primary/10 text-primary border border-primary/20 font-bold text-[10px] uppercase tracking-widest">
                    {isActive ? "Active" : "Inactive"}
                  </Badge>
                </Card>

                <Card className="p-4 rounded-2xl border border-border/60 bg-card/50">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Member Since</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" }) : "—"}
                  </p>
                </Card>
              </div>
            )}
          </section>

          <section className="space-y-8 md:space-y-10">
            <div className="flex items-center gap-4 px-2">
              <div className="h-1.5 w-1.5 rounded-full bg-secondary shadow-[0_0_15px_#22c55e]" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-muted-foreground">Security</h3>
            </div>

            <Card className="bg-card/40 backdrop-blur-3xl border-border/60 rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-12 border-2 shadow-2xl group hover:border-primary/20 transition-all relative overflow-hidden">
               <div className="absolute top-0 right-0 h-48 w-48 bg-primary/5 blur-[80px] rounded-full" />
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 md:gap-10 relative z-10">
                  <div className="space-y-3 md:space-y-4">
                     <h4 className="text-2xl md:text-3xl font-black text-foreground uppercase tracking-tighter">Security credentials</h4>
                     <p className="text-muted-foreground text-base md:text-lg font-medium italic serif max-w-sm leading-relaxed">Ensure your account remains secure by updating your password regularly.</p>
                  </div>
                  <Button variant="ghost" className="h-16 md:h-20 px-8 md:px-12 rounded-2xl md:rounded-[2rem] bg-muted/30 border border-border/60 font-black uppercase text-xs tracking-[0.3em] text-muted-foreground hover:bg-primary hover:text-white transition-all w-full md:w-auto">
                     Update password
                  </Button>
               </div>
            </Card>
          </section>
        </div>
      </div>
    </div>
  )
}
