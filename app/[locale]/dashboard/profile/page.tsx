"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { apiFetch } from "@/lib/api-client"
import { cn, getImageUrl, getOversizedFiles, MAX_UPLOAD_SIZE_BYTES } from "@/lib/utils"
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
  Image as ImageIcon,
  Upload,
  X
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
import { useRouter } from "next/navigation"
import { DEFAULT_TIMEZONE, normalizeRestaurantList } from "@/lib/restaurant-normalizers"

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
  logo?: any
  logo_url?: string
  logo_image_url?: string
  cover?: any
  cover_url?: string
  cover_image_url?: string
  gallery_images?: any[]
  gallery_urls?: string[]
  gallery_image_urls?: string[]
}

import { LoadingSignal } from "@/components/ui/loading-signal"

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const token = (session?.user as any)?.accessToken as string | undefined
  const { toast } = useToast()
  const router = useRouter()

  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<any>(null)
  
  // Create/Edit Dialog States
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState<string | null>(null)
  const [step, setStep] = useState(1)

  const [draft, setDraft] = useState<{
    name: string;
    description: string;
    city: string;
    country: string;
    phone: string;
    email: string;
    address: string;
    cuisine_type: string;
    is_published: boolean;
    slug: string;
    website: string;
    timezone: string;
    logo: File | null;
    cover: File | null;
    gallery_images: File[];
    keep_gallery_urls: string[];
  }>({
    name: "",
    description: "",
    city: "",
    country: "",
    phone: "+251",
    email: "",
    address: "",
    cuisine_type: "",
    is_published: false,
    slug: "",
    website: "",
    timezone: DEFAULT_TIMEZONE,
    logo: null,
    cover: null,
    gallery_images: [],
    keep_gallery_urls: []
  })

  // Previews
  const [previews, setPreviews] = useState<{
    logo: string | null;
    cover: string | null;
    gallery: string[];
  }>({ logo: null, cover: null, gallery: [] })

  const getAllowedFiles = (files: File[]) => {
    const oversized = getOversizedFiles(files)
    if (oversized.length > 0) {
      toast({
        title: "Some files were skipped",
        description: "Each upload must be 5MB or less.",
        variant: "destructive",
      })
    }
    return files.filter((file) => file.size <= MAX_UPLOAD_SIZE_BYTES)
  }


  useEffect(() => {
    if (!token) return
    const load = async () => {
      try {
        setLoading(true)
        const [restRes, subRes] = await Promise.all([
          apiFetch<any>("/my-restaurants", { token }),
          apiFetch<any>("/subscription/me", { token }).catch(() => null)
        ])
        setRestaurants(normalizeRestaurantList(restRes) as any)
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
      const allFiles = [draft.logo, draft.cover, ...draft.gallery_images].filter((file): file is File => Boolean(file))
      const oversized = getOversizedFiles(allFiles)
      if (oversized.length > 0) {
        toast({
          title: "Upload too large",
          description: "Each upload must be 5MB or less.",
          variant: "destructive",
        })
        return
      }

      const url = editingId ? `/my-restaurants/${editingId}` : "/my-restaurants"
      const method = editingId ? "PATCH" : "POST"
      
      const formData = new FormData()
      
      // Append text fields
      Object.entries(draft).forEach(([key, val]) => {
        if (key !== 'logo' && key !== 'cover' && key !== 'gallery_images' && key !== 'keep_gallery_urls') {
          formData.append(key, String(val))
        }
      })

      // Send existing gallery URLs to keep
      if (draft.keep_gallery_urls && draft.keep_gallery_urls.length > 0) {
        draft.keep_gallery_urls.forEach(url => formData.append("keep_gallery_urls", url))
      }

      // Append files
      if (draft.logo) formData.append("logo", draft.logo)
      if (draft.cover) formData.append("cover", draft.cover)
      draft.gallery_images.forEach((file) => {
        formData.append("gallery_images", file)
      })

      await apiFetch(url, { method, token, body: formData })
      
      const res = await apiFetch<any>("/my-restaurants", { token })
      setRestaurants(normalizeRestaurantList(res) as any)
      
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
      name: "", description: "", city: "", country: "", phone: "+251", email: "", address: "", cuisine_type: "", is_published: false,
      slug: "", website: "", timezone: DEFAULT_TIMEZONE,
      logo: null, cover: null, gallery_images: [], keep_gallery_urls: []
    })
    setPreviews({ logo: null, cover: null, gallery: [] })
    setEditingId(null)
    setStep(1)
  }

  const startEdit = (res: Restaurant) => {
    router.push(`/dashboard/restaurants/${res.id}`)
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-6">
        <LoadingSignal />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary animate-pulse">Initializing Dashboard...</p>
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
    <div className="max-w-7xl mx-auto space-y-8 md:space-y-12 pb-20 md:pb-24 px-3 sm:px-4 lg:px-0">
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
              <div className="flex items-center justify-between mb-2">
                <DialogTitle className="text-2xl md:text-3xl font-black">
                  Add New Restaurant
                </DialogTitle>
                <div className="flex items-center gap-2">
                    {[1, 2].map((i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "h-1.5 w-8 rounded-full transition-all duration-500",
                          step === i ? "bg-primary w-12" : "bg-muted"
                        )} 
                      />
                    ))}
                  </div>
              </div>
              <DialogDescription className="text-muted-foreground font-medium italic text-sm">
                {step === 1 ? "Step 1: Tell us about your brand and visuals." : "Step 2: Provide contact and location details."}
              </DialogDescription>
            </DialogHeader>

            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="grid grid-cols-1 xl:grid-cols-12 gap-4 md:gap-6 items-start"
                >
                  <div className="space-y-2 xl:col-span-6">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Slug</Label>
                    <Input className="bg-muted border-border/50 h-11 md:h-12 rounded-xl" placeholder="addis-gebeya" value={draft.slug} onChange={e => setDraft(d => ({ ...d, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }))} />
                  </div>
                  <div className="space-y-2 xl:col-span-6">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Restaurant Name</Label>
                    <Input className="bg-muted border-border/50 h-11 md:h-12 rounded-xl focus:ring-primary/20" placeholder="e.g. Addis Ababa Kitchen" value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} />
                  </div>
                  <div className="space-y-2 xl:col-span-12">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cuisine Type</Label>
                    <Input className="bg-muted border-border/50 h-11 md:h-12 rounded-xl" placeholder="e.g. Ethiopian, Habesha Fusion" value={draft.cuisine_type} onChange={e => setDraft(d => ({ ...d, cuisine_type: e.target.value }))} />
                  </div>

                  {/* Logo & Cover Upload */}
                  <div className="space-y-2 xl:col-span-5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Logo (Profile)</Label>
                    <div className="flex gap-4 items-center">
                      <div className="h-20 w-20 rounded-2xl bg-muted border-2 border-dashed border-border/50 flex items-center justify-center overflow-hidden relative group">
                        {previews.logo ? (
                          <Image src={getImageUrl(previews.logo) || ""} alt="Restaurant logo preview" fill sizes="80px" className="object-cover" />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-muted-foreground/30" />
                        )}
                        <Label htmlFor="logo-upload" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                          <Upload className="h-5 w-5 text-white" />
                        </Label>
                        <input id="logo-upload" type="file" className="hidden" accept="image/*" onChange={e => {
                          const file = e.target.files?.[0]
                          const allowed = getAllowedFiles(file ? [file] : [])
                          if (allowed[0]) {
                            const safeFile = allowed[0]
                            setDraft(d => ({ ...d, logo: safeFile }))
                            setPreviews(p => ({ ...p, logo: URL.createObjectURL(safeFile) }))
                          }
                          e.currentTarget.value = ""
                        }} />
                    <span className="block text-[10px] text-muted-foreground mt-1">(max size 5MB)</span>
                      </div>
                      <p className="text-[9px] text-muted-foreground uppercase font-bold max-w-[120px]">Recommended: Square 512x512</p>
                    </div>
                  </div>

                  <div className="space-y-2 xl:col-span-7">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cover Photo</Label>
                      <span className="block text-[10px] text-muted-foreground mt-1">(max size 5MB)</span>
                    </div>
                    <div className="h-20 w-full rounded-2xl bg-muted border-2 border-dashed border-border/50 flex items-center justify-center overflow-hidden relative group">
                      {previews.cover ? (
                        <Image src={getImageUrl(previews.cover) || ""} alt="Restaurant cover preview" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <Upload className="h-5 w-5 text-muted-foreground/30" />
                        </div>
                      )}
                      <Label htmlFor="cover-upload" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <Upload className="h-5 w-5 text-white" />
                      </Label>
                      <input id="cover-upload" type="file" className="hidden" accept="image/*" onChange={e => {
                        const file = e.target.files?.[0]
                        const allowed = getAllowedFiles(file ? [file] : [])
                        if (allowed[0]) {
                          const safeFile = allowed[0]
                          setDraft(d => ({ ...d, cover: safeFile }))
                          setPreviews(p => ({ ...p, cover: URL.createObjectURL(safeFile) }))
                        }
                        e.currentTarget.value = ""
                      }} />
                    </div>
                  </div>

                  {/* Gallery */}
                  <div className="md:col-span-2 xl:col-span-12 space-y-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Gallery</Label>
                      <span className="block text-[10px] text-muted-foreground mt-1">(max size 5MB)</span>
                    </div>
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                      {previews.gallery.map((url, idx) => (
                        <div key={idx} className="aspect-square rounded-xl bg-muted overflow-hidden relative group border border-border/50">
                          <Image src={getImageUrl(url) || ""} alt="Gallery preview" fill sizes="120px" className="object-cover" />
                          <button 
                            onClick={() => {
                              const urlToRemove = previews.gallery[idx]
                              if (urlToRemove.startsWith('blob:')) {
                                const blobUrlsBefore = previews.gallery.slice(0, idx).filter(u => u.startsWith('blob:'))
                                const fileIdx = blobUrlsBefore.length
                                setDraft(d => ({ ...d, gallery_images: d.gallery_images.filter((_, i) => i !== fileIdx) }))
                              } else {
                                setDraft(d => ({ ...d, keep_gallery_urls: d.keep_gallery_urls.filter(u => u !== urlToRemove) }))
                              }
                              setPreviews(p => ({ ...p, gallery: p.gallery.filter((_, i) => i !== idx) }))
                            }}
                            className="absolute top-1 right-1 h-5 w-5 bg-destructive rounded-full flex items-center justify-center text-white scale-0 group-hover:scale-100 transition-transform"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      <Label htmlFor="gallery-upload" className="aspect-square rounded-xl bg-muted border-2 border-dashed border-border/50 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/80">
                        <Plus className="h-6 w-6 text-muted-foreground/30" />
                        <input id="gallery-upload" type="file" multiple className="hidden" accept="image/*" onChange={e => {
                          const files = Array.from(e.target.files || [])
                          const allowed = getAllowedFiles(files)
                          if (allowed.length > 0) {
                            setDraft(d => ({ ...d, gallery_images: [...d.gallery_images, ...allowed] }))
                            setPreviews(p => ({ ...p, gallery: [...p.gallery, ...allowed.map(f => URL.createObjectURL(f))] }))
                          }
                          e.currentTarget.value = ""
                        }} />
                      </Label>
                    </div>
                  </div>

                  <div className="md:col-span-2 xl:col-span-12 space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</Label>
                    <textarea
                      className="w-full min-h-[110px] md:min-h-[140px] rounded-xl border border-border/50 bg-muted p-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 resize-y"
                      placeholder="Share what makes your Ethiopian menu special..."
                      value={draft.description}
                      onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
                >
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Address</Label>
                    <Input className="bg-muted border-border/50 h-11 md:h-12 rounded-xl" placeholder="Bole Road, Addis Ababa" value={draft.address} onChange={e => setDraft(d => ({ ...d, address: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">City</Label>
                    <Input className="bg-muted border-border/50 h-11 md:h-12 rounded-xl" value={draft.city} onChange={e => setDraft(d => ({ ...d, city: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Country</Label>
                    <Input className="bg-muted border-border/50 h-11 md:h-12 rounded-xl" value={draft.country} onChange={e => setDraft(d => ({ ...d, country: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Phone</Label>
                    <Input className="bg-muted border-border/50 h-11 md:h-12 rounded-xl font-mono" placeholder="+251912345678" value={draft.phone} onFocus={() => { if (!draft.phone.trim()) setDraft(d => ({ ...d, phone: "+251" })) }} onChange={e => setDraft(d => ({ ...d, phone: e.target.value }))} />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Business Email</Label>
                    <Input className="bg-muted border-border/50 h-11 md:h-12 rounded-xl" placeholder="info@addiskitchen.et" value={draft.email} onChange={e => setDraft(d => ({ ...d, email: e.target.value }))} />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Website</Label>
                    <Input className="bg-muted border-border/50 h-11 md:h-12 rounded-xl" placeholder="https://addiskitchen.et" value={draft.website} onChange={e => setDraft(d => ({ ...d, website: e.target.value }))} />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Timezone</Label>
                    <Input className="bg-muted border-border/50 h-11 md:h-12 rounded-xl" placeholder="Africa/Addis_Ababa" value={draft.timezone} onChange={e => setDraft(d => ({ ...d, timezone: e.target.value }))} />
                  </div>
                  <div className="md:col-span-2 flex items-center justify-between p-4 md:p-6 rounded-2xl bg-muted border border-border/50">
                    <div className="space-y-1">
                      <Label className="text-sm font-black text-foreground">Public Visibility</Label>
                      <p className="text-[9px] md:text-[10px] text-muted-foreground font-medium uppercase tracking-widest leading-tight">Allow customers to view your digital menu</p>
                    </div>
                    <Switch checked={draft.is_published} onCheckedChange={(val) => setDraft(d => ({ ...d, is_published: val }))} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <DialogFooter className="mt-8 md:mt-10 flex-col md:flex-row gap-3">
              {step === 2 && (
                <Button variant="ghost" className="w-full md:w-auto px-8 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest text-muted-foreground" onClick={() => setStep(1)}>
                  Back
                </Button>
              )}
              {step === 1 ? (
                <Button className="w-full md:w-auto px-10 h-12 rounded-xl bg-foreground text-background font-black uppercase text-[10px] tracking-widest" onClick={() => setStep(2)} disabled={!draft.name}>
                  Next Step
                </Button>
              ) : (
                <Button className="w-full md:w-auto px-10 h-12 rounded-xl bg-primary text-white font-black uppercase text-[10px] tracking-widest" onClick={handleSave} disabled={saving}>
                  {saving ? <LoadingSignal size="sm" className="h-4 w-4" /> : "Create Restaurant"}
                </Button>
              )}
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
                           <div className="h-20 w-20 md:h-24 md:w-24 rounded-[1.5rem] md:rounded-[2rem] bg-muted border border-border/50 flex items-center justify-center relative group-hover:bg-primary/10 transition-colors shrink-0 overflow-hidden shadow-inner">
                              {res.logo || res.logo_url || res.logo_image_url ? (
                                <Image src={getImageUrl(res.logo || res.logo_url || res.logo_image_url) || ""} alt={res.name} fill sizes="80px" className="object-cover" />
                              ) : (
                                <Building2 className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                              )}
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
                              <div className="flex items-center gap-2"><Activity className="h-3 w-3 text-primary" /> {res.slug ? `/${res.slug}` : "Pending slug"}</div>
                              </div>
                           </div>

                           <div className="flex flex-wrap md:flex-nowrap gap-2 md:gap-3 shrink-0 justify-center">
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
                                {publishing === res.id ? <LoadingSignal size="sm" className="h-4 w-4" /> : res.is_published ? <Eye className="h-4 w-4 md:h-5 md:w-5" /> : <EyeOff className="h-4 w-4 md:h-5 md:w-5" />}
                              </Button>
                              <Button variant="ghost" size="icon" className="h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-muted/50 border border-border/50 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all" onClick={() => setDeletingId(res.id)}>
                                 <Trash2 className="h-4 w-4 md:h-5 md:w-5" />
                              </Button>
                              <Button className="h-12 md:h-14 px-4 md:px-8 rounded-xl md:rounded-2xl bg-foreground text-background font-black uppercase text-[10px] tracking-widest shadow-xl flex-1 md:flex-none group" asChild>
                                 <Link href={`/dashboard/restaurants/${res.id}`}>
                                    Manage <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                 </Link>
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

