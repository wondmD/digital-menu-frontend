"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { 
  ShieldCheck, 
  UserRound, 
  Mail, 
  Smartphone, 
  Shield, 
  CalendarDays, 
  Pencil, 
  X, 
  Check, 
  CreditCard, 
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Clock,
  LayoutGrid,
  Settings,
  ChevronRight,
  Hotel,
  Loader2
} from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { apiFetch } from "@/lib/api-client"
import Link from "next/link"

interface Profile {
  id: string
  email: string
  full_name: string
  phone?: string
  role?: string
  is_active?: boolean
  created_at?: string
}

interface Subscription {
  plan_name: string
  plan_slug: string
  price: number
  currency: string
  status: string
  start_date: string
  end_date: string
  days_remaining: number
  features: {
    max_restaurants: number
    max_categories: number
    max_menu_items: number
    max_staff_accounts: number
    activity_log_enabled: boolean
    analytics_enabled: boolean
  }
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const token = (session?.user as any)?.accessToken as string | undefined
  const { toast } = useToast()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  
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

        // Load Subscription
        try {
          const subRes = await apiFetch<any>("/subscription/me", { token })
          setSubscription(subRes?.data || subRes)
        } catch (err) {
          console.warn("No subscription info found")
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

  const getPlanName = () => {
    if (!subscription) return "Trial"
    return subscription.plan_name || "Active Plan"
  }

  return (
    <div className="max-w-6xl mx-auto space-y-16 pb-24">
      {/* 1. OPERATIONAL CONTROL HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-8 border-b border-border/10">
        <div className="space-y-4">
          <Badge className="bg-primary/10 text-primary border border-primary/20 font-black text-[10px] uppercase tracking-[0.4em] px-5 py-2 rounded-full">
            System Configuration
          </Badge>
          <h1 className="text-6xl font-black tracking-tighter text-foreground uppercase">
            Command <span className="text-muted-foreground italic font-serif lowercase tracking-normal">settings</span>
          </h1>
          <p className="text-muted-foreground font-medium max-w-md text-lg italic serif leading-relaxed">
            "Configure your operational identity and registry access protocols."
          </p>
        </div>
        
        {!isEditing && (
          <Button 
            onClick={() => setIsEditing(true)} 
            className="h-20 px-12 rounded-[2rem] bg-primary text-white font-black uppercase text-xs tracking-[0.3em] hover:scale-105 transition-all shadow-[0_25px_50px_-12px_rgba(230,57,70,0.5)]"
          >
            <Pencil className="h-5 w-5 mr-4" />
            Modify Identity
          </Button>
        )}
      </div>

      <div className="grid gap-12 lg:grid-cols-12">
        {/* Left Column: Personnel Identity */}
        <div className="lg:col-span-7 space-y-16">
          <section className="space-y-10">
            <div className="flex items-center gap-4 px-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-muted-foreground">Operational Credentials</h3>
            </div>

            {isEditing ? (
              <Card className="bg-card/40 backdrop-blur-3xl border-border/10 rounded-[4rem] overflow-hidden border-2 shadow-3xl p-16 animate-in fade-in slide-in-from-bottom-6 duration-700">
                <div className="space-y-12">
                  <div className="grid gap-10">
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-1">Personnel Full Name</Label>
                      <Input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="h-16 rounded-2xl border-border/10 bg-muted/30 font-black px-8 text-xl text-foreground placeholder:text-muted-foreground/50 focus:border-primary/40 transition-all border-2"
                        placeholder="PROTOCOL NAME"
                        disabled={saving}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                       <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-1">Comms Email</Label>
                        <Input value={email} disabled className="h-16 rounded-2xl bg-muted/30 border-border/10 px-8 font-bold text-muted-foreground italic" />
                      </div>
                      <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-1">Signal Uplink (Phone)</Label>
                        <Input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="h-16 rounded-2xl border-border/10 bg-muted/30 font-black px-8 text-xl text-foreground placeholder:text-muted-foreground/50 focus:border-primary/40 transition-all border-2"
                          placeholder="+251 ..."
                          disabled={saving}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 pt-6">
                    <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={saving} className="h-16 flex-1 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                       Abort Changes
                    </Button>
                    <Button 
                      onClick={handleSave} 
                      disabled={saving || !fullName.trim()} 
                      className="h-16 flex-[2] rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-[0.3em] shadow-[0_20px_40px_-10px_rgba(230,57,70,0.4)] hover:scale-[1.02] transition-all"
                    >
                      {saving ? <Loader2 className="animate-spin h-5 w-5" /> : "Commit to Registry"}
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="grid gap-8 md:grid-cols-2">
                <div className="p-10 rounded-[3.5rem] border-2 border-border/10 bg-card/40 backdrop-blur-3xl hover:border-primary/30 transition-all group shadow-3xl">
                  <div className="flex items-center gap-4 mb-6 opacity-30 group-hover:opacity-100 transition-opacity">
                    <div className="h-1 w-12 bg-primary rounded-full" />
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-foreground">Full Name</span>
                  </div>
                  <p className="text-3xl font-black text-foreground tracking-tighter uppercase leading-none">{profile?.full_name || "PROTOCOL ZERO"}</p>
                </div>

                <div className="p-10 rounded-[3.5rem] border-2 border-border/10 bg-card/40 backdrop-blur-3xl hover:border-primary/30 transition-all group shadow-3xl">
                  <div className="flex items-center gap-4 mb-6 opacity-30 group-hover:opacity-100 transition-opacity">
                    <div className="h-1 w-12 bg-primary rounded-full" />
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-foreground">Comms Uplink</span>
                  </div>
                  <p className="text-2xl font-black text-foreground tracking-tighter truncate leading-none">{email}</p>
                </div>

                <div className="p-10 rounded-[3.5rem] border-2 border-border/10 bg-card/40 backdrop-blur-3xl hover:border-primary/30 transition-all group shadow-3xl">
                  <div className="flex items-center gap-4 mb-6 opacity-30 group-hover:opacity-100 transition-opacity">
                    <div className="h-1 w-12 bg-primary rounded-full" />
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-foreground">Registry ID</span>
                  </div>
                  <div className="flex items-center justify-between">
                     <p className="text-2xl font-black text-foreground tracking-widest leading-none">#{profile?.id?.slice(0, 8).toUpperCase() || "UNASSIGNED"}</p>
                     <Badge className="bg-primary/10 text-primary border border-primary/20 font-black text-[9px] px-3 uppercase tracking-widest">Active</Badge>
                  </div>
                </div>

                <div className="p-10 rounded-[3.5rem] border-2 border-border/10 bg-card/40 backdrop-blur-3xl hover:border-primary/30 transition-all group shadow-3xl">
                  <div className="flex items-center gap-4 mb-6 opacity-30 group-hover:opacity-100 transition-opacity">
                    <div className="h-1 w-12 bg-primary rounded-full" />
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-foreground">Commencement</span>
                  </div>
                  <p className="text-2xl font-black text-foreground tracking-tighter leading-none italic serif lowercase">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : "—"}
                  </p>
                </div>
              </div>
            )}
          </section>

          <section className="space-y-10">
            <div className="flex items-center gap-4 px-2">
              <div className="h-1.5 w-1.5 rounded-full bg-secondary shadow-[0_0_15px_#22c55e]" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-muted-foreground">Security Topology</h3>
            </div>

            <Card className="bg-card/40 backdrop-blur-3xl border-border/10 rounded-[4rem] p-12 border-2 shadow-2xl group hover:border-primary/20 transition-all relative overflow-hidden">
               <div className="absolute top-0 right-0 h-48 w-48 bg-primary/5 blur-[80px] rounded-full" />
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 relative z-10">
                  <div className="space-y-4">
                     <h4 className="text-3xl font-black text-foreground uppercase tracking-tighter">Credential Rotation</h4>
                     <p className="text-muted-foreground text-lg font-medium italic serif max-w-sm leading-relaxed">"Rotate your cryptographic access keys periodically to maintain operational security."</p>
                  </div>
                  <Button variant="ghost" className="h-20 px-12 rounded-[2rem] bg-muted/30 border border-border/10 font-black uppercase text-xs tracking-[0.3em] text-muted-foreground hover:bg-primary hover:text-white transition-all">
                     Initialize Reset
                  </Button>
               </div>
            </Card>
          </section>
        </div>

        {/* Right Column: Tier Matrix */}
        <div className="lg:col-span-5 space-y-16">
          <section className="space-y-10">
            <div className="flex items-center gap-4 px-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-muted-foreground">Operational Tier</h3>
            </div>

            <Card className="bg-card border-2 border-primary/20 rounded-[4.5rem] p-16 relative overflow-hidden shadow-3xl group">
               <div className="absolute top-0 right-0 h-80 w-80 bg-primary/10 blur-[120px] rounded-full group-hover:bg-primary/20 transition-all duration-1000" />
               <div className="relative z-10 text-center space-y-12">
                  <Badge className="bg-primary text-white font-black text-[10px] uppercase tracking-[0.5em] px-10 py-3 rounded-full shadow-[0_15px_30px_rgba(230,57,70,0.5)]">
                    {subscription?.plan_name.toUpperCase() || "TRIAL NODE"}
                  </Badge>
                  
                  <div className="space-y-2">
                     <h4 className="text-4xl font-black text-foreground uppercase leading-none tracking-tighter">System Access</h4>
                     <div className="flex items-baseline justify-center gap-2">
                        <span className="text-7xl font-black text-foreground italic serif">{subscription?.currency === "EUR" ? "€" : "$"}{subscription?.price || "0"}</span>
                        <span className="text-muted-foreground font-black uppercase text-[10px] tracking-widest mb-4">/ cycle</span>
                     </div>
                  </div>

                  <div className="space-y-8 pt-10 border-t border-border/10">
                     {[
                       { icon: Hotel, label: "Registry Nodes", value: subscription?.features.max_restaurants || 1 },
                       { icon: LayoutGrid, label: "Asset Classes", value: subscription?.features.max_categories || 10 },
                       { icon: Sparkles, label: "Culinary Assets", value: subscription?.features.max_menu_items || 50 }
                     ].map((stat, i) => (
                       <div key={i} className="flex items-center justify-between group/stat">
                          <div className="flex items-center gap-4">
                             <div className="h-12 w-12 rounded-2xl bg-muted/30 border border-border/10 flex items-center justify-center group-hover/stat:bg-primary transition-all">
                                <stat.icon className="h-6 w-6 text-muted-foreground group-hover/stat:text-white" />
                             </div>
                             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground group-hover/stat:text-foreground transition-colors">{stat.label}</span>
                          </div>
                          <span className="text-2xl font-black text-foreground italic serif">{stat.value}</span>
                       </div>
                     ))}
                  </div>

                  <div className="pt-6 space-y-6">
                     <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">
                        <span>Cycle Health</span>
                        <span className="text-secondary">{subscription?.days_remaining || 0} cycles left</span>
                     </div>
                     <div className="h-4 w-full bg-muted/30 rounded-full overflow-hidden border border-border/10 p-1">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-primary via-orange-500 to-red-600 shadow-[0_0_20px_rgba(230,57,70,0.6)]" 
                          style={{ width: `${Math.min(100, (subscription?.days_remaining || 0) / 30 * 100)}%` }} 
                        />
                     </div>
                  </div>

                  <Button className="w-full h-24 rounded-[2.5rem] border-2 border-border/10 bg-transparent text-foreground font-black uppercase text-xs tracking-[0.5em] group/btn hover:bg-foreground hover:text-background transition-all" asChild>
                     <Link href="/packages" className="flex items-center justify-center gap-4">
                       Scale Network <ArrowUpRight className="h-6 w-6 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-all" />
                     </Link>
                  </Button>
               </div>
            </Card>

            <div className="p-12 rounded-[4rem] bg-card/40 border border-border/10 backdrop-blur-3xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 h-32 w-32 bg-secondary/5 blur-[50px] rounded-full" />
               <div className="flex items-center gap-4 text-secondary mb-6 relative z-10">
                  <Clock className="h-6 w-6" />
                  <span className="text-[10px] font-black uppercase tracking-[0.5em]">Temporal Sync</span>
               </div>
               <p className="text-lg text-muted-foreground font-medium leading-relaxed relative z-10 italic serif">
                  Your next architectural synchronization initiates on <span className="text-foreground font-bold">{subscription?.end_date ? new Date(subscription.end_date).toLocaleDateString() : 'N/A'}</span>. Maintain signal integrity.
               </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
