"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Label } from "@/components/ui/label"
import { apiFetch } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import { 
  Copy, 
  Download, 
  ExternalLink, 
  Printer, 
  QrCode, 
  Smartphone,
  Share2,
  Hotel,
  Sparkles,
  Palette,
  Zap,
  Eye,
  Check
} from "lucide-react"
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Template1 from "@/components/menu-templates/Template1"
import Template2 from "@/components/menu-templates/Template2"
import Template3 from "@/components/menu-templates/Template3"
import { LoadingSignal } from "@/components/ui/loading-signal"
import { ChevronDown, Loader2 } from "lucide-react"
import { QRPrintCard } from "@/components/qr/qr-print-card"

type Restaurant = { 
  id: string; 
  name: string; 
  slug?: string;
  template_number?: number | string;
  logo?: string;
  logo_url?: string;
  logo_image_url?: string;
}

function extractList(payload: any): any[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.items)) return payload.data.items
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

function resolveTemplateNumber(value: any): number {
  const parsed = Number(value?.template_number)
  if (!Number.isFinite(parsed)) return 1
  if (parsed < 1) return 1
  if (parsed > 3) return 3
  return parsed
}

function parseTemplateNumber(value: any): number | null {
  const parsed = Number(value?.template_number)
  if (!Number.isFinite(parsed)) return null
  if (parsed < 1 || parsed > 3) return null
  return parsed
}

function normalizeRestaurant(row: any): Restaurant {
  const id = String(
    row?.id || row?.restaurant_id || row?.restaurantId || row?.ID || row?.uuid || ""
  )

  return {
    ...row,
    id,
    name: String(row?.name || "Restaurant"),
    slug: row?.slug || row?.restaurant_slug || row?.restaurantSlug,
    template_number: resolveTemplateNumber(row),
  }
}

export default function QRPage() {
  const { data: session, status } = useSession()
  const token = (session?.user as any)?.accessToken as string | undefined
  const { toast } = useToast()

  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedId, setSelectedId] = useState("")
  const [loading, setLoading] = useState(true)
  const [updatingTemplate, setUpdatingTemplate] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<number | null>(null)
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false)
  const [printMode, setPrintMode] = useState<'qr' | 'card'>('qr')

  // Removed demo/mock preview data; real preview data is loaded on demand.

  // Preview data loaded from backend when user opens the template preview dialog.
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewHotel, setPreviewHotel] = useState<any | null>(null)
  const [previewCategories, setPreviewCategories] = useState<any[] | null>(null)

  const ready = status === "authenticated" && !!token

  const selected = useMemo(
    () => restaurants.find((r) => r.id === selectedId) || restaurants[0],
    [restaurants, selectedId],
  )

  useEffect(() => {
    if (previewTemplate === null) {
      setPreviewHotel(null)
      setPreviewCategories(null)
      setPreviewLoading(false)
      return
    }
    if (!selected?.id || !token) return

    let cancelled = false
    const loadPreview = async () => {
      try {
        setPreviewLoading(true)
        const hotelRes = await apiFetch<any>(`/restaurants/${selected.id}`, { token })
        const hotel = hotelRes?.data || hotelRes || null

        const catsRes = await apiFetch<any>(`/restaurants/${selected.id}/categories`, { token })
        const cats = extractList(catsRes)

        const enriched = await Promise.all(
          cats.map(async (c: any) => {
            try {
              const itemsRes = await apiFetch<any>(`/restaurants/${selected.id}/categories/${c.id}/items`, { token })
              const items = extractList(itemsRes).slice(0, 8)
              return { ...c, items }
            } catch {
              return { ...c, items: [] }
            }
          })
        )

        if (!cancelled) {
          setPreviewHotel(hotel)
          setPreviewCategories(enriched)
        }
      } catch (err: any) {
        toast({ title: "Could not load preview data", description: err?.message || "", variant: "destructive" })
        if (!cancelled) {
          setPreviewHotel(null)
          setPreviewCategories(null)
        }
      } finally {
        if (!cancelled) setPreviewLoading(false)
      }
    }

    loadPreview()
    return () => {
      cancelled = true
    }
  }, [previewTemplate, selected?.id, token, toast])

  useEffect(() => {
    if (!ready) return
    const load = async () => {
      try {
        setLoading(true)
        const res = await apiFetch<any>("/my-restaurants", { token })
        const list = extractList(res).map(normalizeRestaurant).filter((r) => Boolean(r.id))
        setRestaurants(list)
        if (list.length && (!selectedId || !list.some((r) => r.id === selectedId))) {
          setSelectedId(list[0].id)
        }
      } catch (err: any) {
        toast({ title: "Could not load restaurants", description: err?.message, variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [ready, token, selectedId, toast])

  const origin = typeof window !== "undefined" ? window.location.origin : ""
  const identifier = selected?.slug
  const menuUrl = identifier ? `${origin}/${identifier}` : ""

  const handleCopy = async () => {
    if (!menuUrl) return
    if (!navigator?.clipboard) {
      toast({ title: "Clipboard unavailable", variant: "destructive" })
      return
    }
    try {
      await navigator.clipboard.writeText(menuUrl)
      toast({ title: "Link copied" })
    } catch (err: any) {
      toast({ title: "Could not copy link", description: err?.message, variant: "destructive" })
    }
  }

  const handleTemplateChange = async (templateId: number) => {
    if (!selectedId || !token || updatingTemplate || !selected) return
    if (![1, 2, 3].includes(templateId)) return
    
    try {
      setUpdatingTemplate(true)

      // Optimistically reflect the selected template in UI.
      setRestaurants((prev) =>
        prev.map((r) => (r.id === selected.id ? { ...r, template_number: templateId } : r))
      )

      // Contract: template_number is a numeric field (1, 2, or 3).
      const formData = new FormData()
      formData.append("template_number", String(templateId))
      await apiFetch(`/my-restaurants/${selected.id}`, {
        method: "PATCH",
        token,
        body: formData,
      })

      // Verify persisted value from a fresh list fetch first.
      const refreshedListRes = await apiFetch<any>("/my-restaurants", { token })
      const refreshedList = extractList(refreshedListRes).map(normalizeRestaurant)
      const refreshedSelected = refreshedList.find((r) => r.id === selected.id)
      const persistedTemplate = parseTemplateNumber(refreshedSelected)

      // Fallback verification against public restaurant payload when slug exists.
      let publicTemplate: number | null = null
      if (persistedTemplate !== templateId && selected.id) {
        try {
          const publicRes = await apiFetch<any>(`/restaurants/${selected.id}`)
          const publicRow = publicRes?.data || publicRes
          publicTemplate = parseTemplateNumber(publicRow)
        } catch {
          // Ignore fallback verification failure and rely on owner list result.
        }
      }

      // Only fail when an endpoint explicitly returns a different numeric template_number.
      const explicitMismatch =
        (persistedTemplate !== null && persistedTemplate !== templateId) ||
        (publicTemplate !== null && publicTemplate !== templateId)

      if (explicitMismatch) {
        throw new Error("Template update request was accepted, but backend returned a different template_number.")
      }
      
      // Update local state
      setRestaurants(
        refreshedList.length > 0
          ? refreshedList
          : prev => prev.map((r) =>
              r.id === selected.id
                ? { ...r, template_number: templateId }
                : r
            )
      )
      
      toast({
        title: "Template updated",
        description:
          persistedTemplate === null && publicTemplate === null
            ? `Template ${templateId} selected. Backend accepted update but does not return template_number in read response.`
            : `Template ${templateId} is now active for ${selected.name}.`,
      })
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err?.message || "Could not persist template change.",
        variant: "destructive"
      })
    } finally {
      setUpdatingTemplate(false)
    }
  }

  const currentTemplate = resolveTemplateNumber(selected)

  if (!ready) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Smartphone className="h-12 w-12 text-muted-foreground animate-pulse" />
        <p className="text-sm text-muted-foreground font-medium">Sign in to initialize your QR codes.</p>
      </div>
    )
  }

  return (
    <div className="dashboard-surface-polish max-w-6xl mx-auto space-y-8 pb-20 px-3 sm:px-4 lg:px-0">
      {/* 1. QR CODE SETTINGS */}
      <div className="relative overflow-hidden rounded-3xl bg-card/40 border border-border/70 ring-1 ring-border/60 p-1 px-1">
        <div className="absolute inset-0 bg-linear-to-r from-primary/10 via-transparent to-transparent opacity-50" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between p-6 md:p-8 gap-6">
          <div className="space-y-3 text-center md:text-left">
            <Badge className="bg-primary/10 text-primary border border-primary/20 font-black text-[9px] uppercase tracking-[0.4em] px-4 py-1.5 rounded-full w-fit mx-auto md:mx-0">
              QR codes
            </Badge>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground uppercase leading-tight md:leading-none">
              QR menu <br className="sm:hidden" /> <span className="text-muted-foreground italic font-serif lowercase tracking-normal">access</span>
            </h1>
            <p className="text-muted-foreground font-medium max-w-md text-sm md:text-base italic serif mx-auto md:mx-0">
              Manage your menu's QR codes and sharing links for your customers.
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full min-w-0 md:max-w-sm lg:max-w-md">
            <Label className="text-[9px] uppercase font-black tracking-[0.4em] text-muted-foreground ml-2 text-center md:text-left">Currently customizing</Label>
            <div className="relative group">
              <Hotel className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              <select
                className="h-12 md:h-14 w-full rounded-xl md:rounded-2xl border border-border/50 bg-background/80 backdrop-blur-md pl-12 md:pl-14 pr-12 text-[10px] md:text-xs font-black tracking-[0.2em] text-foreground shadow-xl focus:border-primary/40 focus:outline-none transition-all appearance-none cursor-pointer uppercase"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                disabled={!restaurants.length || loading}
              >
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id} className="bg-card text-foreground">
                    {r.name.toUpperCase()}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary pointer-events-none group-hover:scale-110 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-6 opacity-80">
           <LoadingSignal />
           <p className="font-black uppercase tracking-[0.5em] text-[10px] text-primary">Loading QR settings...</p>
        </div>
      ) : !restaurants.length ? (
        <div className="py-24 text-center bg-muted/20 rounded-3xl border-2 border-dashed border-border/60 group hover:border-primary/20 transition-all p-8">
          <div className="h-24 w-24 rounded-3xl bg-card border border-border/60 flex items-center justify-center mx-auto mb-8 shadow-2xl group-hover:scale-110 transition-transform duration-700">
            <QrCode className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <h3 className="text-2xl md:text-3xl font-black tracking-tight text-foreground mb-4 uppercase">No restaurants found.</h3>
          <p className="text-muted-foreground font-medium max-w-sm mx-auto mb-8 text-sm md:text-base leading-relaxed italic serif">
            Add a restaurant to generate QR codes for your digital menu.
          </p>
          <Button asChild className="h-14 px-12 rounded-xl bg-primary text-white font-black uppercase text-[10px] tracking-[0.3em] hover:scale-105 transition-all shadow-xl shadow-primary/20">
             <Link href="/dashboard/profile">Add restaurant</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:gap-8 lg:grid-cols-12">
          {/* Main Card: Sharing link */}
          <Card className="lg:col-span-7 bg-card/40 backdrop-blur-3xl border-border/70 ring-1 ring-border/60 shadow-xl rounded-2xl overflow-hidden border">
            <CardHeader className="p-6 md:p-10 flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/60 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-secondary animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-[0.4em] text-secondary">Status: Active</span>
                </div>
                <div>
                   <CardTitle className="text-2xl md:text-3xl font-black tracking-tighter text-foreground uppercase leading-none">Digital menu link</CardTitle>
                   <p className="text-muted-foreground mt-2 text-sm md:text-base font-medium italic serif max-w-xs leading-relaxed">
                      The direct link to your digital menu for customers.
                   </p>
                </div>
              </div>
              <div className="h-16 w-16 md:h-16 md:w-16 rounded-2xl bg-muted/50 border border-border/60 flex items-center justify-center shadow-lg shrink-0">
                <Share2 className="h-6 md:h-6 text-primary" />
              </div>
            </CardHeader>

            <CardContent className="p-6 md:p-10 space-y-8">
              <div className="space-y-4">
                <Label className="text-[9px] font-black uppercase tracking-[0.5em] text-muted-foreground ml-2">Menu URL</Label>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 h-12 md:h-14 bg-muted/30 rounded-xl border border-border/50 flex items-center px-6 md:px-8 font-black text-xs md:text-sm tracking-widest text-primary truncate">
                    {menuUrl}
                  </div>
                  <Button 
                    variant="ghost" 
                    onClick={handleCopy}
                    className="h-12 w-12 md:h-14 md:w-14 rounded-xl bg-muted border border-border/60 hover:bg-primary/10 hover:border-primary/20 transition-all group shrink-0"
                  >
                    <Copy className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground group-hover:text-primary" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 pt-4">
                 <div className="p-4 md:p-6 rounded-2xl bg-muted/10 border border-border/50 group hover:border-primary/20 transition-all">
                    <div className="h-10 w-10 rounded-xl bg-card border border-border/60 flex items-center justify-center mb-4 group-hover:bg-primary transition-all">
                       <Smartphone className="h-4 w-4 text-muted-foreground group-hover:text-white" />
                    </div>
                    <h5 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] text-foreground mb-1">Mobile optimized</h5>
                    <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-widest">Fast loading on all devices.</p>
                 </div>
                 <div className="p-4 md:p-6 rounded-2xl bg-muted/10 border border-border/50 group hover:border-primary/20 transition-all">
                    <div className="h-10 w-10 rounded-xl bg-card border border-border/60 flex items-center justify-center mb-4 group-hover:bg-primary transition-all">
                       <QrCode className="h-4 w-4 text-muted-foreground group-hover:text-white" />
                    </div>
                    <h5 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] text-foreground mb-1">High quality QR</h5>
                    <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-widest">High resolution for printing.</p>
                 </div>
              </div>
            </CardContent>
          </Card>

          {/* QR Side Card: QR code */}
          <div className="lg:col-span-5 space-y-6 md:space-y-8">
            <Card className="bg-card border border-border/70 ring-1 ring-border/60 rounded-3xl p-8 md:p-10 flex flex-col items-center shadow-xl relative overflow-hidden group">
               <div className="absolute inset-0 bg-primary/2 opacity-0 group-hover:opacity-100 transition-opacity" />
               <div className="relative z-10 p-4 rounded-3xl bg-white shadow-xl">
                 <div className="h-48 w-48 md:h-56 md:w-56 bg-white rounded-xl flex items-center justify-center p-2">
                    <Image 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(menuUrl)}`}
                      alt="Menu QR"
                      width={250}
                      height={250}
                      sizes="(max-width: 768px) 176px, 208px"
                      className="h-44 w-44 md:h-52 md:w-52"
                    />
                 </div>
               </div>
               
               <div className="mt-8 md:mt-10 space-y-6 w-full relative z-10 text-center">
                  <div className="space-y-1">
                    <h4 className="text-xl md:text-2xl font-black tracking-tighter text-foreground uppercase">QR code</h4>
                    <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.5em] text-muted-foreground">Scan to view menu</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <Button 
                        variant="ghost" 
                        className="w-full h-12 md:h-14 rounded-xl border border-border/60 bg-muted/30 font-black uppercase text-[10px] tracking-[0.4em] text-muted-foreground hover:text-foreground hover:bg-muted transition-all" 
                        onClick={() => setIsPrintDialogOpen(true)}
                    >
                        <Printer className="h-4 w-4 mr-3" /> Print Menu access
                    </Button>
                  </div>
               </div>
            </Card>

            <div className="p-6 md:p-8 rounded-2xl bg-primary/10 border border-primary/30 ring-1 ring-primary/20 space-y-3 relative overflow-hidden">
               <div className="absolute top-0 right-0 h-24 w-24 bg-primary/10 blur-2xl rounded-full" />
               <div className="flex items-center gap-3 text-primary relative z-10">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                  <p className="text-[9px] font-black uppercase tracking-[0.5em]">Placement tip</p>
               </div>
               <p className="text-[11px] text-muted-foreground font-medium leading-relaxed relative z-10 serif italic">
                  Display your QR codes in well-lit areas. Our codes are designed for easy scanning in most lighting conditions.
               </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. MENU TEMPLATE SELECTION */}
      {!loading && restaurants.length > 0 && (
        <div className="space-y-6 md:space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
             <div className="space-y-3 text-center md:text-left">
                <Badge className="bg-secondary/10 text-secondary border border-secondary/20 font-black text-[9px] uppercase tracking-[0.4em] px-4 py-1.5 rounded-full w-fit mx-auto md:mx-0">
                   Menu Design
                </Badge>
                <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-foreground uppercase">
                   Menu <span className="text-muted-foreground italic font-serif lowercase tracking-normal">templates</span>
                </h2>
                <p className="text-muted-foreground font-medium max-w-md italic serif text-sm">
                   Choose the design that best represents your brand.
                </p>
             </div>
          </div>

          <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
             {/* Template 1: Classic */}
             <div className="flex flex-col gap-4">
                <button 
                  onClick={() => handleTemplateChange(1)}
                  disabled={updatingTemplate}
                  className={cn(
                    "relative group text-left p-1 rounded-2xl md:rounded-3xl transition-all overflow-hidden flex-1",
                    currentTemplate === 1
                      ? "bg-primary shadow-xl scale-[1.02]"
                      : "bg-card/40 hover:bg-card/60 grayscale-[0.8] hover:grayscale-0"
                  )}
                >
                  <div className="bg-background/90 rounded-[0.9rem] md:rounded-[1.4rem] p-6 h-full space-y-4 md:space-y-6 flex flex-col">
                    <div className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center transition-all",
                        currentTemplate === 1 ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                    )}>
                        <Sparkles className="h-5 w-5" />
                    </div>
                    <div className="space-y-2 flex-1">
                        <h4 className="text-lg font-black uppercase tracking-tighter text-foreground">Classic Elegant</h4>
                        <p className="text-muted-foreground text-[10px] md:text-xs leading-relaxed font-medium">Refined layout for polished hospitality brands.</p>
                    </div>
                    {currentTemplate === 1 && (
                      <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-primary animate-pulse">
                          <Check className="h-3 w-3" />
                          Active
                      </div>
                    )}
                  </div>
                </button>
                <button 
                  onClick={() => handleTemplateChange(2)}
                  disabled={updatingTemplate}
                  className={cn(
                    "relative group text-left p-1 rounded-2xl md:rounded-3xl transition-all overflow-hidden flex-1",
                    currentTemplate === 2 
                      ? "bg-primary shadow-xl scale-[1.02]" 
                      : "bg-card/40 hover:bg-card/60 grayscale-[0.8] hover:grayscale-0"
                  )}
                >
                  <div className="bg-background/90 rounded-[0.9rem] md:rounded-[1.4rem] p-6 h-full space-y-4 md:space-y-6 flex flex-col">
                    <div className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center transition-all",
                        currentTemplate === 2 ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                    )}>
                        <Palette className="h-5 w-5" />
                    </div>
                    <div className="space-y-2 flex-1">
                        <h4 className="text-lg font-black uppercase tracking-tighter text-foreground">Modern Visual</h4>
                        <p className="text-muted-foreground text-[10px] md:text-xs leading-relaxed font-medium">Image-forward grid layout optimized for cafes.</p>
                    </div>
                    {currentTemplate === 2 && (
                      <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-primary animate-pulse">
                          <Check className="h-3 w-3" />
                          Active
                      </div>
                    )}
                  </div>
                </button>
                <Button 
                   variant="ghost" 
                   size="sm"
                   onClick={() => setPreviewTemplate(2)}
                   className="rounded-full font-black text-[9px] uppercase tracking-widest text-muted-foreground hover:text-primary gap-2"
                >
                   <Eye className="h-3.5 w-3.5" /> Preview
                </Button>
             </div>

             {/* Template 3: Fast */}
             <div className="flex flex-col gap-4">
                <button 
                  onClick={() => handleTemplateChange(3)}
                  disabled={updatingTemplate}
                  className={cn(
                    "relative group text-left p-1 rounded-2xl md:rounded-[3rem] transition-all overflow-hidden flex-1",
                    currentTemplate === 3 
                      ? "bg-primary shadow-[0_30px_60px_-12px_rgba(230,57,70,0.3)] scale-[1.02]" 
                      : "bg-card/40 hover:bg-card/60 grayscale-[0.8] hover:grayscale-0"
                  )}
                >
                  <div className="bg-background/90 rounded-[1.4rem] md:rounded-[2.9rem] p-6 md:p-8 h-full space-y-4 md:space-y-6 flex flex-col">
                    <div className={cn(
                        "h-12 w-12 md:h-16 md:w-16 rounded-2xl md:rounded-3xl flex items-center justify-center transition-all",
                        currentTemplate === 3 ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                    )}>
                        <Zap className="h-6 w-6 md:h-8 md:w-8" />
                    </div>
                    <div className="space-y-2 flex-1">
                        <h4 className="text-lg md:text-xl font-black uppercase tracking-tighter text-foreground">Fast & Minimal</h4>
                        <p className="text-muted-foreground text-[11px] md:text-xs leading-relaxed font-medium">High-efficiency list view for QSR, bars, and bistros where speed of selection is priority.</p>
                    </div>
                    {currentTemplate === 3 && (
                      <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">
                          <Check className="h-3 w-3" />
                          Active Template
                      </div>
                    )}
                  </div>
                </button>
                <Button 
                   variant="ghost" 
                   size="sm"
                   onClick={() => setPreviewTemplate(3)}
                   className="rounded-full font-black text-[9px] md:text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary gap-2"
                >
                   <Eye className="h-3.5 w-3.5" /> Preview Template
                </Button>
             </div>
          </div>
        </div>
      )}

      {/* Template Preview Dialog */}
      <Dialog open={previewTemplate !== null} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
        <DialogContent className="w-full max-w-[100vw] sm:max-w-[96vw] md:max-w-[94vw] lg:max-w-[1200px] h-full md:h-[90vh] p-0 overflow-hidden border-none rounded-none md:rounded-[2rem] lg:rounded-[3rem]">
          <div className="h-full w-full bg-background overflow-y-auto custom-scrollbar">
             <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                   <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-primary flex items-center justify-center text-white shrink-0">
                      {previewTemplate === 1 && <Sparkles className="h-4 w-4 md:h-5 md:w-5" />}
                      {previewTemplate === 2 && <Palette className="h-4 w-4 md:h-5 md:w-5" />}
                      {previewTemplate === 3 && <Zap className="h-4 w-4 md:h-5 md:w-5" />}
                   </div>
                   <div>
                      <DialogTitle className="text-base md:text-lg font-black uppercase tracking-tighter">
                         {previewTemplate === 1 && "Classic Elegant"}
                         {previewTemplate === 2 && "Modern Visual"}
                         {previewTemplate === 3 && "Fast & Minimal"}
                         <span className="ml-2 text-muted-foreground font-medium italic lowercase tracking-normal">preview</span>
                      </DialogTitle>
                      <p className="text-[9px] md:text-[10px] font-medium text-muted-foreground uppercase tracking-[0.2em]">Live Template Visualization</p>
                   </div>
                </div>
                <Button 
                   onClick={() => {
                      if (previewTemplate) handleTemplateChange(previewTemplate)
                      setPreviewTemplate(null)
                   }}
                   className="w-full md:w-auto rounded-full bg-primary px-8 font-black text-[9px] md:text-[10px] uppercase tracking-widest"
                >
                   Apply This Design
                </Button>
             </div>

             <div className="relative">
                {previewLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : previewHotel && previewCategories ? (
                  previewTemplate === 1 ? (
                    <Template1
                      hotel={previewHotel}
                      categories={previewCategories}
                      activeCategory={previewCategories[0]?.id}
                      onCategoryChange={() => {}}
                      onItemClick={() => {}}
                      searchQuery={""}
                      onSearchChange={() => {}}
                      itemsLoading={false}
                    />
                  ) : previewTemplate === 2 ? (
                    <Template2
                      hotel={previewHotel}
                      categories={previewCategories}
                      activeCategory={previewCategories[0]?.id}
                      onCategoryChange={() => {}}
                      onItemClick={() => {}}
                      searchQuery={""}
                      onSearchChange={() => {}}
                      itemsLoading={false}
                    />
                  ) : (
                    <Template3
                      hotel={previewHotel}
                      categories={previewCategories}
                      activeCategory={previewCategories[0]?.id}
                      onCategoryChange={() => {}}
                      onItemClick={() => {}}
                      searchQuery={""}
                      onSearchChange={() => {}}
                      itemsLoading={false}
                    />
                  )
                ) : (
                  <div className="p-8 text-center text-muted-foreground">No preview data available for this restaurant.</div>
                )}
             </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 5. PRINT OPTIONS DIALOG */}
      <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border rounded-4xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Print Options</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 mt-6">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center gap-1 rounded-2xl border-2 hover:border-primary hover:bg-primary/5 group"
              onClick={() => {
                setPrintMode('qr')
                setTimeout(() => {
                  window.print()
                  setIsPrintDialogOpen(false)
                }, 100)
              }}
            >
              <QrCode className="h-6 w-6 group-hover:text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest">Option 1: Only QR Code</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-24 flex flex-col items-center justify-center gap-1 rounded-2xl border-2 hover:border-primary hover:bg-primary/5 group text-center"
              onClick={() => {
                setPrintMode('card')
                setTimeout(() => {
                  window.print()
                  setIsPrintDialogOpen(false)
                }, 100)
              }}
            >
              <Palette className="h-6 w-6 group-hover:text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest leading-tight">Option 2: Design Card (3×4)</span>
              <span className="text-[8px] font-medium text-muted-foreground uppercase tracking-widest mt-1">Logo + Name + Brand Design</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print Areas (Hidden on screen) */}
      <div className="hidden print:block fixed inset-0 bg-white z-9999">
         <style>{`
           @media print {
             body * { visibility: hidden !important; }
             .print-container, .print-container * { visibility: visible !important; }
             .print-container { 
                position: fixed; 
                left: 0; 
                top: 0; 
                width: 100vw; 
                height: 100vh; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                background: white !important; 
                z-index: 99999;
             }
             @page { size: auto; margin: 0; }
           }
         `}</style>
         <div className="print-container">
            {selected && (printMode === 'qr' ? (
              <div className="text-center p-12 bg-white border border-gray-100 rounded-[3rem]">
                <Image 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(menuUrl)}`}
                  alt="Menu QR"
                  width={1000}
                  height={1000}
                  sizes="384px"
                  className="h-96 w-96"
                />
                <div className="mt-8 space-y-2">
                   <p className="text-2xl font-black uppercase tracking-[0.4em] text-black">Scan to View Menu</p>
                   <p className="text-lg font-bold text-black font-serif italic">{selected.name}</p>
                </div>
              </div>
            ) : (
              <QRPrintCard restaurant={selected} qrUrl={menuUrl} />
            ))}
         </div>
      </div>
    </div>
  )
}
