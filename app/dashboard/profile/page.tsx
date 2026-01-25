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
        toast({ title: "Error", description: "Failed to load restaurant data.", variant: "destructive" })
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
      
      toast({ title: editingId ? "Restaurant updated" : "Restaurant added" })
      setOpen(false)
      resetDraft()
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!token || !deletingId) return
    try {
      await apiFetch(`/my-restaurants/${deletingId}`, { method: "DELETE", token })
      setRestaurants(prev => prev.filter(r => r.id !== deletingId))
      toast({ title: "Restaurant deleted" })
      setDeletingId(null)
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" })
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
      toast({ title: newStatus ? "Menu published" : "Menu unpublished" })
    } catch (err: any) {
      toast({ title: "Status update failed", description: err.message, variant: "destructive" })
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
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Loading your restaurants...</p>
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
    <div className="max-w-7xl mx-auto space-y-8 md:space-y-12 pb-20 md:pb-24 px-4 md:px-0">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(230,57,70,0.5)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Restaurant Management</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-foreground">
            Restaurants <span className="italic font-serif text-primary">Overview.</span>
          </h1>
          <p className="text-muted-foreground font-medium max-w-md text-sm md:text-base">
            Manage all your restaurant locations and their menu status from one central dashboard.
          </p>
        </div>

        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetDraft(); }}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto h-12 md:h-14 px-8 md:px-10 rounded-xl md:rounded-2xl bg-primary text-white font-black uppercase text-[10px] md:text-xs tracking-widest hover:scale-105 transition-transform shadow-2xl shadow-primary/20">
              <Plus className="h-4 w-4 mr-2" /> Add Restaurant
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border text-foreground rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 max-w-2xl w-[95vw] md:w-full overflow-y-auto max-h-[90vh]">
            <DialogHeader className="mb-6 md:mb-8">
              <DialogTitle className="text-2xl md:text-3xl font-black">{editingId ? "Edit Restaurant" : "Add Restaurant"}</DialogTitle>
              <DialogDescription className="text-muted-foreground font-medium italic text-sm">Enter the details for your restaurant location.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Restaurant Name</Label>
                <Input className="bg-muted border-border/50 h-11 md:h-12 rounded-xl focus:ring-primary/20" placeholder="e.g. Harbor View Bistro" value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Menu Link Slug</Label>
                <Input className="bg-muted border-border/50 h-11 md:h-12 rounded-xl text-primary font-bold" placeholder="harbor-view-01" value={draft.slug} onChange={e => setDraft(d => ({ ...d, slug: e.target.value }))} />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Address</Label>
                <Input className="bg-muted border-border/50 h-11 md:h-12 rounded-xl" placeholder="123 Main Street" value={draft.address} onChange={e => setDraft(d => ({ ...d, address: e.target.value }))} />
              </div>
              <div className="space-y-2 text-foreground">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">City</Label>
                <Input className="bg-muted border-border/50 h-11 md:h-12 rounded-xl" value={draft.city} onChange={e => setDraft(d => ({ ...d, city: e.target.value }))} />
              </div>
              <div className="space-y-2 text-foreground">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cuisine Type</Label>
                <Input className="bg-muted border-border/50 h-11 md:h-12 rounded-xl" placeholder="e.g. Modern Italian" value={draft.cuisine_type} onChange={e => setDraft(d => ({ ...d, cuisine_type: e.target.value }))} />
              </div>
              <div className="md:col-span-2 flex items-center justify-between p-4 md:p-6 rounded-2xl bg-muted border border-border/50">
                 <div className="space-y-1">
                    <Label className="text-sm font-black text-foreground">Public Visibility</Label>
                    <p className="text-[9px] md:text-[10px] text-muted-foreground font-medium uppercase tracking-widest leading-tight">Allow customers to view your digital menu</p>
                 </div>
                 <Switch checked={draft.is_published} onCheckedChange={(val) => setDraft(d => ({ ...d, is_published: val }))} />
              </div>
            </div>
            <DialogFooter className="mt-8 md:mt-10 flex-col md:flex-row gap-3">
              <Button variant="ghost" className="w-full md:w-auto px-8 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest text-muted-foreground" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="w-full md:w-auto px-10 h-12 rounded-xl bg-primary text-white font-black uppercase text-[10px] tracking-widest" onClick={handleSave} disabled={saving || !draft.name}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? "Save Changes" : "Add Restaurant"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-4 gap-8 md:gap-12">
        {/* Restaurant List */}
        <div className="lg:col-span-3 space-y-8 order-2 lg:order-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/50 pb-4 px-2 gap-4">
            <div className="flex items-center gap-3">
              <Activity className="h-4 w-4 text-secondary" />
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">My Restaurants</h2>
            </div>
            <div className="flex gap-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground">
               <span>Total: {restaurants.length}</span>
               <span className="text-primary">Published: {restaurants.filter(r => r.is_published).length}</span>
            </div>
          </div>

          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-6"
          >
            {restaurants.length === 0 ? (
              <div className="p-12 md:p-24 rounded-[2rem] md:rounded-[3rem] border-2 border-dashed border-border/50 bg-card/40 text-center space-y-6 md:space-y-8">
                 <Building2 className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground/30 mx-auto" />
                 <div className="space-y-2">
                    <h3 className="text-xl md:text-2xl font-black text-foreground">No restaurants added yet</h3>
                    <p className="text-xs md:text-sm text-muted-foreground font-medium max-w-xs mx-auto">Add your first restaurant location to start creating your digital menu.</p>
                 </div>
                 <Button className="h-12 px-10 rounded-xl bg-foreground text-background font-black uppercase text-[10px] tracking-[0.3em]" onClick={() => setOpen(true)}>Add Restaurant</Button>
              </div>
            ) : (
              restaurants.map((res) => (
                <motion.div key={res.id} variants={item}>
                   <Card className="bg-card/40 backdrop-blur-3xl border-border/50 rounded-[2rem] md:rounded-[2.5rem] group hover:border-primary/20 transition-all duration-500 overflow-hidden relative shadow-2xl">
                      <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row md:items-center p-6 md:p-8 gap-6 md:gap-8">
                           <div className="h-20 w-20 md:h-24 md:w-24 rounded-[1.5rem] md:rounded-[2rem] bg-muted border border-border/50 flex items-center justify-center relative group-hover:bg-primary/10 transition-colors shrink-0">
                              <Building2 className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                              {res.is_published && (
                                <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-secondary shadow-[0_0_10px_rgba(42,157,143,0.5)] border-4 border-background" />
                              )}
                           </div>

                           <div className="flex-1 space-y-2 md:space-y-3 min-w-0">
                              <div className="flex items-center gap-3 flex-wrap">
                                 <h4 className="text-xl md:text-2xl font-black text-foreground truncate">{res.name}</h4>
                                 <Badge className={cn(
                                   "text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] border-none px-2 md:px-3 h-4 md:h-5",
                                   res.is_published ? "bg-secondary text-white" : "bg-muted text-muted-foreground"
                                 )}>
                                   {res.is_published ? "Published" : "Draft"}
                                 </Badge>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6 text-[9px] md:text-[10px] font-bold text-muted-foreground truncate">
                                 <div className="flex items-center gap-2"><MapPin className="h-3 w-3 text-primary" /> {res.city || "Location"}</div>
                                 <div className="flex items-center gap-2"><UtensilsCrossed className="h-3 w-3 text-primary" /> {res.cuisine_type || "Cuisine"}</div>
                                 <div className="flex items-center gap-2"><Activity className="h-3 w-3 text-primary" /> {res.slug ? "Active" : "Pending"}</div>
                              </div>
                           </div>

                           <div className="flex flex-wrap md:flex-nowrap gap-2 md:gap-3 shrink-0 justify-center">
                              <Button variant="ghost" size="icon" className="h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-muted/50 border border-border/50 text-muted-foreground hover:text-foreground transition-all" onClick={() => startEdit(res)}>
                                 <Settings className="h-4 w-4 md:h-5 md:w-5 font-bold" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                disabled={publishing === res.id}
                                className={cn(
                                   "h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl border transition-all",
                                   res.is_published ? "bg-primary/20 border-primary/40 text-primary hover:bg-primary hover:text-white" : "bg-muted/50 border-border/50 text-muted-foreground hover:text-foreground"
                                )}
                                onClick={() => togglePublish(res)}
                              >
                                 {publishing === res.id ? <Loader2 className="animate-spin h-4 w-4" /> : res.is_published ? <Eye className="h-4 w-4 md:h-5 md:w-5" /> : <EyeOff className="h-4 w-4 md:h-5 md:w-5" />}
                              </Button>
                              <Button variant="ghost" size="icon" className="h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-muted/50 border border-border/50 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all" onClick={() => setDeletingId(res.id)}>
                                 <Trash2 className="h-4 w-4 md:h-5 md:w-5" />
                              </Button>
                              <Button className="h-12 md:h-14 px-4 md:px-6 rounded-xl md:rounded-2xl bg-foreground text-background font-black uppercase text-[10px] tracking-widest shadow-xl flex-1 md:flex-none" asChild>
                                 <Link href={`/dashboard/menu?hotel=${res.id}`}>Manage Menu</Link>
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

        {/* Sidebar Info */}
        <div className="space-y-8 order-1 lg:order-2">
           <Card className="p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] bg-card/40 backdrop-blur-3xl border border-border/50 space-y-6 md:space-y-8 shadow-2xl relative overflow-hidden">
              <div className="space-y-2 relative z-10">
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Account Limits</h4>
                <p className="text-[11px] text-muted-foreground font-medium italic underline decoration-primary/30 underline-offset-4">{subscription?.plan_name || 'Active Plan'}</p>
              </div>

              <div className="space-y-6 md:space-y-8 relative z-10">
                 {/* Units Usage */}
                 <div className="space-y-4">
                    <div className="flex justify-between items-end">
                       <div className="space-y-1">
                          <p className="text-xs font-black text-foreground uppercase tracking-widest">Restaurants</p>
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

                 {/* Menu Items */}
                 <div className="space-y-4 pt-4 border-t border-border/50">
                    <div className="flex justify-between items-end">
                       <div className="space-y-1">
                          <p className="text-xs font-black text-foreground uppercase tracking-widest">Digital Menu Items</p>
                          <p className="text-[10px] font-bold text-muted-foreground">Active Usage</p>
                       </div>
                       <Layers className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                       <div className="h-full bg-foreground w-[65%]" />
                    </div>
                 </div>
              </div>

              <Button variant="outline" className="w-full h-12 md:h-14 rounded-xl md:rounded-2xl border-border/50 bg-muted/30 text-foreground font-black uppercase text-[10px] tracking-[0.2em] relative z-10 hover:bg-primary hover:text-white transition-all" asChild>
                 <Link href="/packages">Upgrade Plan</Link>
              </Button>
           </Card>

           <div className="p-6 md:p-8 rounded-[2rem] bg-secondary/10 border border-secondary/20 space-y-4">
              <div className="flex items-center gap-3 text-secondary">
                 <Shield className="h-5 w-5" />
                 <p className="text-[10px] font-black uppercase tracking-widest">Secure Storage</p>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                 Your restaurant data is securely stored and synchronized across our cloud network for 99.9% uptime.
              </p>
           </div>
        </div>
      </div>

      <AlertDialog open={!!deletingId} onOpenChange={val => { if(!val) setDeletingId(null); }}>
        <AlertDialogContent className="bg-card border-border text-foreground rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 max-w-[90vw] md:max-w-lg">
          <AlertDialogHeader className="mb-6">
             <div className="h-12 w-12 md:h-16 md:w-16 bg-destructive/10 rounded-xl md:rounded-2xl flex items-center justify-center text-destructive mb-4 md:mb-6">
                <Trash2 className="h-6 w-6 md:h-8 md:w-8" />
             </div>
            <AlertDialogTitle className="text-2xl md:text-3xl font-black italic font-serif">Remove Restaurant?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-medium text-base md:text-lg leading-relaxed">
              Deleting this restaurant will permanently remove its menu data and public access. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col md:flex-row gap-3">
            <AlertDialogCancel className="h-12 rounded-xl bg-muted border-border/50 text-foreground font-black uppercase text-[10px] tracking-widest">Cancel</AlertDialogCancel>
            <AlertDialogAction className="h-12 rounded-xl bg-destructive text-white font-black uppercase text-[10px] tracking-widest hover:bg-destructive/90 shadow-2xl shadow-destructive/20" onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

