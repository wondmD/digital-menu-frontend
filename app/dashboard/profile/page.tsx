"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { apiFetch } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import { 
  Building2, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  LayoutGrid,
  UtensilsCrossed,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Shield,
  Eye,
  EyeOff,
  Activity,
  Layers,
  Users,
  Search,
  Plus,
  Trash2,
  Settings,
  Loader2
} from "lucide-react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { motion, AnimatePresence } from "framer-motion"

type Restaurant = {
  id: string
  name: string
  slug?: string
  description?: string
  phone?: string
  address?: string
  city?: string
  country?: string
  is_published?: boolean
  created_at?: string
  cuisine_type?: string
  email?: string
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const token = (session?.user as any)?.accessToken as string | undefined
  const { toast } = useToast()

  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<any>(null)
  
  // Create/Edit Dialog States
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState<string | null>(null)

  const [draft, setDraft] = useState({
    name: "",
    slug: "",
    description: "",
    city: "",
    country: "",
    phone: "",
    email: "",
    address: "",
    cuisine_type: "",
    is_published: false,
  })

  useEffect(() => {
    if (!token) return
    const load = async () => {
      try {
        setLoading(true)
        const [restRes, subRes] = await Promise.all([
          apiFetch<any>("/my-restaurants", { token }),
          apiFetch<any>("/subscription/me", { token }).catch(() => null)
        ])
        setRestaurants(Array.isArray(restRes) ? restRes : (restRes?.data || []))
        setSubscription(subRes?.data || subRes)
      } catch (err: any) {
        toast({ title: "Registry Error", description: "Failed to sync unit data.", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  const handleSave = async () => {
    if (!token || !draft.name.trim()) return
    try {
      setSaving(true)
      const url = editingId ? `/my-restaurants/${editingId}` : "/my-restaurants"
      const method = editingId ? "PATCH" : "POST"
      
      const formData = new FormData()
      Object.entries(draft).forEach(([key, val]) => {
        formData.append(key, String(val))
      })

      await apiFetch(url, { method, token, body: formData })
      
      const res = await apiFetch<any>("/my-restaurants", { token })
      setRestaurants(Array.isArray(res) ? res : (res?.data || []))
      
      toast({ title: editingId ? "Unit Calibrated" : "Unit Established" })
      setOpen(false)
      resetDraft()
    } catch (err: any) {
      toast({ title: "Operation Failed", description: err.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!token || !deletingId) return
    try {
      await apiFetch(`/my-restaurants/${deletingId}`, { method: "DELETE", token })
      setRestaurants(prev => prev.filter(r => r.id !== deletingId))
      toast({ title: "Unit Decommissioned" })
      setDeletingId(null)
    } catch (err: any) {
      toast({ title: "Operation Failed", description: err.message, variant: "destructive" })
    }
  }

  const togglePublish = async (res: Restaurant) => {
    if (!token) return
    try {
      setPublishing(res.id)
      const newStatus = !res.is_published
      const formData = new FormData()
      formData.append("is_published", String(newStatus))

      await apiFetch(`/my-restaurants/${res.id}`, { method: "PATCH", token, body: formData })
      setRestaurants(prev => prev.map(r => r.id === res.id ? { ...r, is_published: newStatus } : r))
      toast({ title: newStatus ? "Broadcast Live" : "Broadcast Offline" })
    } catch (err: any) {
      toast({ title: "Signal Error", description: err.message, variant: "destructive" })
    } finally {
      setPublishing(null)
    }
  }

  const resetDraft = () => {
    setDraft({
      name: "", slug: "", description: "", city: "", country: "", phone: "", email: "", address: "", cuisine_type: "", is_published: false
    })
    setEditingId(null)
  }

  const startEdit = (res: Restaurant) => {
    setDraft({
      name: res.name,
      slug: res.slug || "",
      description: res.description || "",
      city: res.city || "",
      country: res.country || "",
      phone: res.phone || "",
      email: res.email || "",
      address: res.address || "",
      cuisine_type: res.cuisine_type || "",
      is_published: res.is_published || false
    })
    setEditingId(res.id)
    setOpen(true)
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Syncing Operational Matrix</p>
      </div>
    )
  }

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(230,57,70,0.5)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Establishment Command</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight text-foreground">
            Operational <span className="italic font-serif text-primary">Matrix.</span>
          </h1>
          <p className="text-muted-foreground font-medium max-w-md">
            Coordinate and manage multiple global deployment units from a singular high-fidelity interface.
          </p>
        </div>

        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetDraft(); }}>
          <DialogTrigger asChild>
            <Button className="h-14 px-10 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-widest hover:scale-105 transition-transform shadow-2xl shadow-primary/20">
              <Plus className="h-4 w-4 mr-2" /> Establish New Unit
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border text-foreground rounded-[2.5rem] p-10 max-w-2xl">
            <DialogHeader className="mb-8">
              <DialogTitle className="text-3xl font-black">{editingId ? "Unit Calibration" : "New Unit Formation"}</DialogTitle>
              <DialogDescription className="text-muted-foreground font-medium italic">Define the operational parameters for your new establishment.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Unit Identity</Label>
                <Input className="bg-muted border-border/50 h-12 rounded-xl focus:ring-primary/20" placeholder="e.g. Harbor View Bistro" value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Slug Segment</Label>
                <Input className="bg-muted border-border/50 h-12 rounded-xl text-primary font-bold" placeholder="harbor-view-01" value={draft.slug} onChange={e => setDraft(d => ({ ...d, slug: e.target.value }))} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Operational Locale</Label>
                <Input className="bg-muted border-border/50 h-12 rounded-xl" placeholder="123 Culinary Drive, Sector 7" value={draft.address} onChange={e => setDraft(d => ({ ...d, address: e.target.value }))} />
              </div>
              <div className="space-y-2 text-foreground">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">City</Label>
                <Input className="bg-muted border-border/50 h-12 rounded-xl" value={draft.city} onChange={e => setDraft(d => ({ ...d, city: e.target.value }))} />
              </div>
              <div className="space-y-2 text-foreground">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cuisine Tag</Label>
                <Input className="bg-muted border-border/50 h-12 rounded-xl" placeholder="e.g. Modern Italian" value={draft.cuisine_type} onChange={e => setDraft(d => ({ ...d, cuisine_type: e.target.value }))} />
              </div>
              <div className="col-span-2 flex items-center justify-between p-6 rounded-2xl bg-muted border border-border/50">
                 <div className="space-y-1">
                    <Label className="text-sm font-black text-foreground">Public Broadcast</Label>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Visible to external search engines</p>
                 </div>
                 <Switch checked={draft.is_published} onCheckedChange={(val) => setDraft(d => ({ ...d, is_published: val }))} />
              </div>
            </div>
            <DialogFooter className="mt-10 gap-3">
              <Button variant="ghost" className="px-8 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest text-muted-foreground" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="px-10 h-12 rounded-xl bg-primary text-white font-black uppercase text-[10px] tracking-widest" onClick={handleSave} disabled={saving || !draft.name}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? "Update Parameters" : "Finalize Unit"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-4 gap-12">
        {/* Unit Matrix List */}
        <div className="lg:col-span-3 space-y-8">
          <div className="flex items-center justify-between border-b border-border/50 pb-4 px-2">
            <div className="flex items-center gap-3">
              <Activity className="h-4 w-4 text-secondary" />
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">Operational Matrix</h2>
            </div>
            <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
               <span>Total: {restaurants.length} Items</span>
               <span className="text-primary">Active: {restaurants.filter(r => r.is_published).length} Live</span>
            </div>
          </div>

          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-6"
          >
            {restaurants.length === 0 ? (
              <div className="p-24 rounded-[3rem] border-2 border-dashed border-border/50 bg-card/40 text-center space-y-8">
                 <Building2 className="h-16 w-16 text-muted-foreground/30 mx-auto" />
                 <div className="space-y-2">
                    <h3 className="text-2xl font-black text-foreground">No Active Deployments</h3>
                    <p className="text-muted-foreground font-medium max-w-xs mx-auto">Establish your first operational unit to begin broadcasting your menu registry.</p>
                 </div>
                 <Button className="h-12 px-10 rounded-xl bg-foreground text-background font-black uppercase text-[10px] tracking-[0.3em]" onClick={() => setOpen(true)}>Initialize Command</Button>
              </div>
            ) : (
              restaurants.map((res) => (
                <motion.div key={res.id} variants={item}>
                   <Card className="bg-card/40 backdrop-blur-3xl border-border/50 rounded-[2.5rem] group hover:border-primary/20 transition-all duration-500 overflow-hidden relative shadow-2xl">
                      <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row md:items-center p-8 gap-8">
                           <div className="h-24 w-24 rounded-[2rem] bg-muted border border-border/50 flex items-center justify-center relative group-hover:bg-primary/10 transition-colors shrink-0">
                              <Building2 className="h-10 w-10 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                              {res.is_published && (
                                <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-secondary shadow-[0_0_10px_rgba(42,157,143,0.5)] border-4 border-background" />
                              )}
                           </div>

                           <div className="flex-1 space-y-3 min-w-0">
                              <div className="flex items-center gap-3 flex-wrap">
                                 <h4 className="text-2xl font-black text-foreground truncate">{res.name}</h4>
                                 <Badge className={cn(
                                   "text-[9px] font-black uppercase tracking-[0.2em] border-none px-3 h-5",
                                   res.is_published ? "bg-secondary text-white" : "bg-muted text-muted-foreground"
                                 )}>
                                   {res.is_published ? "Active Signal" : "Draft Buffer"}
                                 </Badge>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-[10px] font-bold text-muted-foreground truncate">
                                 <div className="flex items-center gap-2"><MapPin className="h-3 w-3 text-primary" /> {res.city || "Global Location"}</div>
                                 <div className="flex items-center gap-2"><UtensilsCrossed className="h-3 w-3 text-primary" /> {res.cuisine_type || "Intl. Gastronomy"}</div>
                                 <div className="flex items-center gap-2"><Activity className="h-3 w-3 text-primary" /> 1.2k Total Scans</div>
                              </div>
                           </div>

                           <div className="flex gap-3 shrink-0">
                              <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-muted/50 border border-border/50 text-muted-foreground hover:text-foreground transition-all" onClick={() => startEdit(res)}>
                                 <Settings className="h-5 w-5 font-bold" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                disabled={publishing === res.id}
                                className={cn(
                                   "h-14 w-14 rounded-2xl border transition-all",
                                   res.is_published ? "bg-primary/20 border-primary/40 text-primary hover:bg-primary hover:text-white" : "bg-muted/50 border-border/50 text-muted-foreground hover:text-foreground"
                                )}
                                onClick={() => togglePublish(res)}
                              >
                                 {publishing === res.id ? <Loader2 className="animate-spin h-4 w-4" /> : res.is_published ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                              </Button>
                              <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-muted/50 border border-border/50 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all" onClick={() => setDeletingId(res.id)}>
                                 <Trash2 className="h-5 w-5" />
                              </Button>
                              <Button className="h-14 px-6 rounded-2xl bg-foreground text-background font-black uppercase text-[10px] tracking-widest shadow-xl" asChild>
                                 <Link href={`/dashboard/menu?hotel=${res.id}`}>Configure</Link>
                              </Button>
                           </div>
                        </div>
                      </CardContent>
                   </Card>
                </motion.div>
              ))
            )}
          </motion.div>
        </div>

        {/* Intelligence Sidebar */}
        <div className="space-y-8">
           <Card className="p-10 rounded-[3rem] bg-card/40 backdrop-blur-3xl border border-border/50 space-y-8 shadow-2xl relative overflow-hidden">
              <div className="space-y-2 relative z-10">
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Registry Limits</h4>
                <p className="text-[11px] text-muted-foreground font-medium italic underline decoration-primary/30 underline-offset-4">{subscription?.plan_name || 'Active'} Allocation Phase</p>
              </div>

              <div className="space-y-8 relative z-10">
                 {/* Units Usage */}
                 <div className="space-y-4">
                    <div className="flex justify-between items-end">
                       <div className="space-y-1">
                          <p className="text-xs font-black text-foreground uppercase tracking-widest">Deployed Units</p>
                          <p className="text-[10px] font-bold text-muted-foreground">{restaurants.length} OF {subscription?.features?.max_restaurants === -1 ? '∞' : (subscription?.features?.max_restaurants || '1')}</p>
                       </div>
                       <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                       <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${subscription?.features?.max_restaurants === -1 ? 0 : Math.min(100, (restaurants.length / (subscription?.features?.max_restaurants || 1)) * 100)}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="h-full bg-primary shadow-[0_0_10px_rgba(230,57,70,0.5)]" 
                       />
                    </div>
                 </div>

                 {/* Menu Items (Placeholder as per UX request) */}
                 <div className="space-y-4 pt-4 border-t border-border/50">
                    <div className="flex justify-between items-end">
                       <div className="space-y-1">
                          <p className="text-xs font-black text-foreground uppercase tracking-widest">Menu Registry</p>
                          <p className="text-[10px] font-bold text-muted-foreground">1.2k ITEMS ALLOCATED</p>
                       </div>
                       <Layers className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                       <div className="h-full bg-foreground w-[65%]" />
                    </div>
                 </div>
              </div>

              <Button variant="outline" className="w-full h-14 rounded-2xl border-border/50 bg-muted/30 text-foreground font-black uppercase text-[10px] tracking-[0.2em] relative z-10 hover:bg-primary hover:text-white transition-all" asChild>
                 <Link href="/packages">Modify Capacity Matrix</Link>
              </Button>
           </Card>

           <div className="p-8 rounded-[2.5rem] bg-secondary/10 border border-secondary/20 space-y-4">
              <div className="flex items-center gap-3 text-secondary">
                 <Shield className="h-5 w-5" />
                 <p className="text-[10px] font-black uppercase tracking-widest">Operational Security</p>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                 Your unit deployments are encrypted and redundantly synchronized across our <span className="text-foreground italic">Charter Cloud</span> network. 
              </p>
           </div>
        </div>
      </div>

      <AlertDialog open={!!deletingId} onOpenChange={val => { if(!val) setDeletingId(null); }}>
        <AlertDialogContent className="bg-card border-border text-foreground rounded-[2.5rem] p-10">
          <AlertDialogHeader className="mb-6">
             <div className="h-16 w-16 bg-destructive/10 rounded-2xl flex items-center justify-center text-destructive mb-6">
                <Trash2 className="h-8 w-8" />
             </div>
            <AlertDialogTitle className="text-3xl font-black italic font-serif">Decommission Unit?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-medium text-lg leading-relaxed">
              Removing this establishment unit will permanently sever its menu registries and broadcast signal. This action is irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-4">
            <AlertDialogCancel className="h-14 px-8 rounded-xl bg-muted border-border/50 text-foreground font-black uppercase text-[10px] tracking-widest">Keep Active</AlertDialogCancel>
            <AlertDialogAction className="h-14 px-8 rounded-xl bg-destructive text-white font-black uppercase text-[10px] tracking-widest hover:bg-destructive/90 shadow-2xl shadow-destructive/20" onClick={handleDelete}>Decommission</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

