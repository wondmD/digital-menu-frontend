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
  ChevronRight
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
    <div className="max-w-4xl mx-auto space-y-12 pb-24">
      {/* Header Section - Modern & Clean */}
      <div className="space-y-4 text-center md:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-[0.2em]">
          <Settings className="h-3 w-3" />
          Workspace Configuration
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-8">
          <div>
            <h1 className="text-5xl font-black tracking-tighter text-foreground">Settings</h1>
            <p className="text-muted-foreground text-lg font-medium mt-1">Manage your account preferences and billing subscription.</p>
          </div>
          {!isEditing && (
            <Button 
              onClick={() => setIsEditing(true)} 
              className="rounded-full px-8 h-12 font-bold gap-2 transition-all hover:scale-105"
            >
              <Pencil className="h-4 w-4" />
              Edit Account
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-12 lg:grid-cols-12">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-12">
          
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                <UserRound className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold tracking-tight">Personal Identity</h3>
            </div>

            <div className="grid gap-6">
              {isEditing ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                      <Input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="h-14 rounded-2xl border-2 focus:ring-primary/10 font-bold px-5"
                        placeholder="Full Name"
                        disabled={saving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Email (Read-only)</Label>
                      <Input value={email} disabled className="h-14 rounded-2xl bg-muted/30 border-dashed px-5 font-medium italic" />
                    </div>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Phone Number</Label>
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="h-14 rounded-2xl border-2 focus:ring-primary/10 font-bold px-5"
                        placeholder="+251 ..."
                        disabled={saving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Role</Label>
                      <Input value={role} disabled className="h-14 rounded-2xl bg-muted/30 border-dashed px-5 font-bold uppercase tracking-tighter" />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-3 pt-4">
                    <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={saving} className="rounded-xl font-bold">
                       Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving || !fullName.trim()} className="rounded-xl px-10 h-12 font-bold gap-2">
                      {saving ? "Saving..." : <><Check className="h-4 w-4" /> Save Changes</>}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-6 rounded-3xl border bg-card/50 hover:bg-card transition-colors space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Legal Name</span>
                    <p className="text-lg font-bold">{profile?.full_name || "—"}</p>
                  </div>
                  <div className="p-6 rounded-3xl border bg-card/50 hover:bg-card transition-colors space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email Address</span>
                    <p className="text-lg font-bold truncate">{email}</p>
                  </div>
                  <div className="p-6 rounded-3xl border bg-card/50 hover:bg-card transition-colors space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Phone Number</span>
                    <p className="text-lg font-bold">{profile?.phone || "Not set"}</p>
                  </div>
                  <div className="p-6 rounded-3xl border bg-card/50 hover:bg-card transition-colors space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Account Since</span>
                    <p className="text-lg font-bold">
                      {profile?.created_at ? new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : "—"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold tracking-tight">Security & Privacy</h3>
            </div>
            <div className="p-8 rounded-3xl border bg-card/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <p className="font-bold">Password Management</p>
                <p className="text-sm text-muted-foreground">It is a good idea to update your password regularly.</p>
              </div>
              <Button variant="outline" className="rounded-2xl font-bold px-6">Change Password</Button>
            </div>
          </section>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-8">
           <Card className="rounded-[2.5rem] border-none bg-gradient-to-b from-primary to-primary/80 text-primary-foreground shadow-2xl shadow-primary/20 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles className="h-24 w-24" />
              </div>
              <CardHeader className="relative z-10">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-black italic tracking-tight">Subscription</CardTitle>
                  <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                </div>
                <CardDescription className="text-primary-foreground/70 font-bold uppercase tracking-widest text-[10px]">Your Growth Engine</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10 space-y-8">
                 <div className="space-y-2">
                    <p className="text-5xl font-black tracking-tighter italic">{getPlanName()}</p>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md px-3 py-1 font-bold uppercase tracking-wider text-[10px]">
                        {subscription?.status || (subscription ? "Active" : "Trial")}
                      </Badge>
                      {subscription && (
                        <div className="text-[10px] font-bold text-white/70 uppercase tracking-widest">
                           {subscription.days_remaining} Days Left
                        </div>
                      )}
                    </div>
                 </div>

                 <div className="space-y-3">
                   {subscription?.start_date && (
                     <div className="flex items-center gap-3 bg-black/10 rounded-2xl p-4 transition-colors hover:bg-black/20">
                        <CalendarDays className="h-5 w-5 text-primary-foreground/50" />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-primary-foreground/50">Activated On</p>
                          <p className="text-sm font-bold">{new Date(subscription.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                     </div>
                   )}

                 {subscription?.end_date && (
                   <div className="space-y-3">
                     <div className="flex items-center gap-3 bg-black/10 rounded-2xl p-4 transition-colors hover:bg-black/20">
                        <Clock className="h-5 w-5 text-primary-foreground/50" />
                        <div className="flex-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-primary-foreground/50">Renews on</p>
                          <p className="text-sm font-bold">{new Date(subscription.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                     </div>
                     
                     {/* Expiration Progress & Warning */}
                     <div className="space-y-2 px-1">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter text-white/50">
                           <span>Cycle Progress</span>
                           <span>{subscription.days_remaining} Days Remaining</span>
                        </div>
                        <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                           <div 
                             className={`h-full transition-all duration-1000 ${subscription.days_remaining <= 5 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-white'}`}
                             style={{ width: `${Math.max(5, Math.min(100, (subscription.days_remaining / 31) * 100))}%` }}
                           />
                        </div>
                        {subscription.days_remaining <= 5 && (
                          <div className="mt-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex gap-3 items-start animate-pulse">
                             <Shield className="h-4 w-4 text-red-500 mt-0.5" />
                             <div className="space-y-1">
                                <p className="text-xs font-black text-red-500 uppercase tracking-tight">Immediate Action Required</p>
                                <p className="text-[10px] font-medium text-red-500/80 leading-tight">
                                   Your subscription expires in {subscription.days_remaining} days. Renew now to avoid interruption of your digital menu services.
                                </p>
                             </div>
                          </div>
                        )}
                     </div>
                   </div>
                 )}
               </div>

               {subscription?.features && (
                 <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-white/40 uppercase">Restaurants</p>
                      <p className="text-sm font-bold">{subscription.features.max_restaurants === -1 ? 'Unlimited' : `Max ${subscription.features.max_restaurants}`}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-white/40 uppercase">Categories</p>
                      <p className="text-sm font-bold">{subscription.features.max_categories === -1 ? 'Unlimited' : `Max ${subscription.features.max_categories}`}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-white/40 uppercase">Menu Items</p>
                      <p className="text-sm font-bold">{subscription.features.max_menu_items === -1 ? 'Unlimited' : `Max ${subscription.features.max_menu_items}`}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-white/40 uppercase">Staff</p>
                      <p className="text-sm font-bold">{subscription.features.max_staff_accounts === -1 ? 'Unlimited' : `Max ${subscription.features.max_staff_accounts}`}</p>
                    </div>
                 </div>
               )}

                 <Button className="w-full bg-white text-primary hover:bg-gray-100 rounded-2xl h-14 font-black uppercase tracking-widest text-xs shadow-xl group" asChild>
                    <Link href="/packages" className="flex items-center justify-center gap-2">
                      Upgrade My Tier
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                    </Link>
                 </Button>
              </CardContent>
           </Card>

           <div className="p-8 rounded-[2.5rem] bg-muted/30 border border-dashed border-muted-foreground/20 space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                <LayoutGrid className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold">Advanced Features</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">Unlock multi-restaurant management, staff permissions, and priority support in the Gold Tier.</p>
              </div>
              <Link href="/packages" className="text-sm font-black text-primary hover:underline inline-flex items-center gap-1 group">
                View all pricing details 
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
           </div>
        </div>
      </div>
    </div>
  )
}
