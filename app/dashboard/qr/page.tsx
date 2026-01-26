"use client"

import Link from "next/link"
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

type Restaurant = { 
  id: string; 
  name: string; 
  slug?: string;
  public_template?: number | string;
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

  const mockRestaurant = {
    name: "The Golden Leaf",
    slug: "golden-leaf",
    description: "Artisanal coffee and gourmet pastries.",
  }

  const mockCategories = [
    {
      id: "c1",
      name: "Signature Creations",
      description: "Our chef's favorite seasonal dishes.",
      items: [
        {
          id: "m1",
          name: "Organic Avocado Toast",
          description: "Sourdough bread, mashed avocado, radish, and microgreens.",
          price: 14.0,
          currency: "$",
          category_id: "c1",
          image_url: "/avocado-toast.png"
        },
        {
          id: "m2",
          name: "Classic Latte",
          description: "Double shot of espresso with silky steamed milk.",
          price: 5.5,
          currency: "$",
          category_id: "c1",
          image_url: "/latte-art.png"
        }
      ]
    },
    {
       id: "c2",
       name: "Sweet Delights",
       items: [
         {
           id: "m3",
           name: "Golden Croissant",
           description: "Buttery, flaky pastry baked fresh every morning.",
           price: 4.5,
           currency: "$",
           category_id: "c2",
           image_url: "/golden-croissant.png"
         }
       ]
    }
  ]

  const ready = status === "authenticated" && !!token

  useEffect(() => {
    if (!ready) return
    const load = async () => {
      try {
        setLoading(true)
        const res = await apiFetch<{ data: Restaurant[] }>("/my-restaurants", { token })
        const list = res?.data || []
        setRestaurants(list)
        if (list.length && !selectedId) setSelectedId(list[0].id)
      } catch (err: any) {
        toast({ title: "Could not load restaurants", description: err?.message, variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [ready, token, selectedId, toast])

  const selected = useMemo(
    () => restaurants.find((r) => r.id === selectedId) || restaurants[0],
    [restaurants, selectedId],
  )

  const origin = typeof window !== "undefined" ? window.location.origin : ""
  // Updated to use the numeric/UUID ID as the primary identifier, pointing directly to the menu list
  const menuUrl = selected?.id ? `${origin}/menu/${selected.id}/list` : ""

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
    if (!selectedId || !token || updatingTemplate) return
    
    try {
      setUpdatingTemplate(true)
      await apiFetch(`/my-restaurants/${selectedId}`, {
        method: "PATCH",
        token,
        body: { public_template: templateId }
      })
      
      // Update local state
      setRestaurants(prev => prev.map(r => 
        r.id === selectedId ? { ...r, public_template: templateId } : r
      ))
      
      toast({
        title: "Template updated",
        description: `Template ${templateId} has been updated successfully.`,
      })
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err.message,
        variant: "destructive"
      })
    } finally {
      setUpdatingTemplate(false)
    }
  }

  const currentTemplate = Number(selected?.public_template) || 1

  if (!ready) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Smartphone className="h-12 w-12 text-muted-foreground animate-pulse" />
        <p className="text-sm text-muted-foreground font-medium">Sign in to initialize your QR codes.</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 md:space-y-16 pb-20 md:pb-24 px-4 md:px-0">
      {/* 1. QR CODE SETTINGS */}
      <div className="relative overflow-hidden rounded-[2rem] md:rounded-[3rem] bg-card/40 border border-border/60 p-1 px-1">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent opacity-50" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between p-6 md:p-10 gap-6 md:gap-8">
          <div className="space-y-3 md:space-y-4 text-center md:text-left">
            <Badge className="bg-primary/10 text-primary border border-primary/20 font-black text-[9px] md:text-[10px] uppercase tracking-[0.4em] px-4 md:px-5 py-1.5 md:py-2 rounded-full w-fit mx-auto md:mx-0">
              QR codes
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground uppercase leading-tight md:leading-none">
              QR menu <br className="sm:hidden" /> <span className="text-muted-foreground italic font-serif lowercase tracking-normal">access</span>
            </h1>
            <p className="text-muted-foreground font-medium max-w-md text-base md:text-lg italic serif mx-auto md:mx-0">
              Manage your menu's QR codes and sharing links for your customers.
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full md:min-w-[280px]">
            <Label className="text-[9px] md:text-[10px] uppercase font-black tracking-[0.4em] text-muted-foreground ml-2 text-center md:text-left">Select restaurant</Label>
            <div className="relative group">
              <Hotel className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-primary" />
              <select
                className="h-14 md:h-16 w-full rounded-xl md:rounded-[2rem] border border-border/50 bg-background/80 backdrop-blur-md pl-12 md:pl-14 pr-6 text-[10px] md:text-xs font-black tracking-[0.2em] text-foreground shadow-3xl focus:border-primary/40 focus:outline-none transition-all appearance-none cursor-pointer uppercase"
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
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-6 opacity-80">
           <div className="h-24 w-24 rounded-[3rem] bg-card border border-border/60 flex items-center justify-center shadow-3xl">
              <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
           </div>
           <p className="font-black uppercase tracking-[0.5em] text-[10px] text-primary">Loading QR settings...</p>
        </div>
      ) : !restaurants.length ? (
        <div className="py-24 md:py-40 text-center bg-muted/20 rounded-[2.5rem] md:rounded-[4rem] border-2 border-dashed border-border/60 group hover:border-primary/20 transition-all p-8">
          <div className="h-24 w-24 md:h-32 md:w-32 rounded-[2.5rem] md:rounded-[3.5rem] bg-card border border-border/60 flex items-center justify-center mx-auto mb-8 md:mb-10 shadow-3xl group-hover:scale-110 transition-transform duration-700">
            <QrCode className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <h3 className="text-3xl md:text-4xl font-black tracking-tight text-foreground mb-4 md:mb-6 uppercase">No restaurants found.</h3>
          <p className="text-muted-foreground font-medium max-w-sm mx-auto mb-8 md:mb-12 text-base md:text-lg leading-relaxed italic serif">
            Add a restaurant to generate QR codes for your digital menu.
          </p>
          <Button asChild className="h-16 md:h-20 px-12 md:px-16 rounded-xl md:rounded-[2rem] bg-primary text-white font-black uppercase text-[10px] md:text-xs tracking-[0.3em] hover:scale-105 transition-all shadow-[0_25px_50px_-12px_rgba(230,57,70,0.4)]">
             <Link href="/dashboard/profile">Add restaurant</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-8 md:gap-12 lg:grid-cols-12">
          {/* Main Card: Sharing link */}
          <Card className="lg:col-span-7 bg-card/40 backdrop-blur-3xl border-border/60 shadow-2xl rounded-[2.5rem] md:rounded-[4rem] overflow-hidden border-2">
            <CardHeader className="p-8 md:p-16 flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/60 gap-8">
              <div className="space-y-4 md:space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-secondary animate-pulse shadow-[0_0_10px_#22c55e]" />
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-secondary">Status: Active</span>
                </div>
                <div>
                   <CardTitle className="text-3xl md:text-5xl font-black tracking-tighter text-foreground uppercase leading-none">Digital menu link</CardTitle>
                   <p className="text-muted-foreground mt-4 text-base md:text-lg font-medium italic serif max-w-xs leading-relaxed">
                      The direct link to your digital menu for customers.
                   </p>
                </div>
              </div>
              <div className="h-20 w-20 md:h-24 md:w-24 rounded-2xl md:rounded-[2.5rem] bg-muted/50 border border-border/60 flex items-center justify-center shadow-3xl shrink-0">
                <Share2 className="h-8 md:h-10 text-primary" />
              </div>
            </CardHeader>

            <CardContent className="p-8 md:p-16 space-y-8 md:space-y-12">
              <div className="space-y-4 md:space-y-6">
                <Label className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground ml-2">Menu URL</Label>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 h-16 md:h-20 bg-muted/30 rounded-xl md:rounded-[2rem] border border-border/50 flex items-center px-6 md:px-8 font-black text-xs md:text-sm tracking-widest text-primary truncate shadow-inner">
                    {menuUrl}
                  </div>
                  <Button 
                    variant="ghost" 
                    onClick={handleCopy}
                    className="h-16 w-16 md:h-20 md:w-20 rounded-xl md:rounded-[2rem] bg-muted border border-border/60 hover:bg-primary/10 hover:border-primary/20 transition-all group shrink-0"
                  >
                    <Copy className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground group-hover:text-primary" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 pt-6">
                 <div className="p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] bg-muted/10 border border-border/50 group hover:border-primary/20 transition-all">
                    <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-card border border-border/60 flex items-center justify-center mb-4 md:mb-6 group-hover:bg-primary transition-all">
                       <Smartphone className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground group-hover:text-white" />
                    </div>
                    <h5 className="text-[11px] md:text-xs font-black uppercase tracking-[0.3em] text-foreground mb-2">Mobile optimized</h5>
                    <p className="text-[9px] md:text-[10px] text-muted-foreground font-medium leading-relaxed uppercase tracking-widest">Optimized for fast loading on all mobile devices.</p>
                 </div>
                 <div className="p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] bg-muted/10 border border-border/50 group hover:border-primary/20 transition-all">
                    <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-card border border-border/60 flex items-center justify-center mb-4 md:mb-6 group-hover:bg-primary transition-all">
                       <QrCode className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground group-hover:text-white" />
                    </div>
                    <h5 className="text-[11px] md:text-xs font-black uppercase tracking-[0.3em] text-foreground mb-2">High quality QR</h5>
                    <p className="text-[9px] md:text-[10px] text-muted-foreground font-medium leading-relaxed uppercase tracking-widest">High resolution QR code for printing on menus or tables.</p>
                 </div>
              </div>
            </CardContent>
          </Card>

          {/* QR Side Card: QR code */}
          <div className="lg:col-span-5 space-y-8 md:space-y-10">
            <Card className="bg-card border-2 border-border/60 rounded-[2.5rem] md:rounded-[4.5rem] p-8 md:p-16 flex flex-col items-center shadow-3xl relative overflow-hidden group">
               <div className="absolute inset-0 bg-primary/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
               <div className="relative z-10 p-4 md:p-6 rounded-[2rem] md:rounded-[3.5rem] bg-white shadow-[0_0_120px_rgba(255,255,255,0.08)]">
                 <div className="h-48 w-48 md:h-72 md:w-72 bg-white rounded-xl md:rounded-[2rem] flex items-center justify-center p-2 md:p-4">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(menuUrl)}`}
                      alt="Menu QR"
                      className="h-44 w-44 md:h-64 md:w-64"
                    />
                 </div>
               </div>
               
               <div className="mt-10 md:mt-16 space-y-8 md:space-y-10 w-full relative z-10 text-center">
                  <div className="space-y-2 md:space-y-3">
                    <h4 className="text-2xl md:text-3xl font-black tracking-tighter text-foreground uppercase">QR code</h4>
                    <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground">Scan to view menu</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3 md:gap-4">
                    <Button 
                        className="w-full h-16 md:h-20 rounded-xl md:rounded-[2rem] bg-primary text-white font-black uppercase text-[10px] md:text-xs tracking-[0.4em] hover:bg-primary/90 transition-all shadow-[0_20px_50px_-15px_rgba(230,57,70,0.5)]" 
                        asChild
                    >
                       <a href={`https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(menuUrl)}`} download="Agelgil_QR.png" target="_blank">
                          <Download className="h-4 w-4 md:h-5 md:w-5 mr-3 md:mr-4" /> Download QR
                       </a>
                    </Button>
                    <Button 
                        variant="ghost" 
                        className="w-full h-16 md:h-20 rounded-xl md:rounded-[2rem] border border-border/60 bg-muted/30 font-black uppercase text-[10px] md:text-xs tracking-[0.4em] text-muted-foreground hover:text-foreground hover:bg-muted transition-all" 
                        onClick={() => window.print()}
                    >
                        <Printer className="h-4 w-4 md:h-5 md:w-5 mr-3 md:mr-4" /> Print QR code
                    </Button>
                  </div>
               </div>
            </Card>

            <div className="p-6 md:p-10 rounded-2xl md:rounded-[3rem] bg-primary/10 border border-primary/20 space-y-4 relative overflow-hidden">
               <div className="absolute top-0 right-0 h-24 md:h-32 w-24 md:w-32 bg-primary/10 blur-[40px] md:blur-[60px] rounded-full" />
               <div className="flex items-center gap-3 md:gap-4 text-primary relative z-10">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                  <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em]">Placement tip</p>
               </div>
               <p className="text-[11px] md:text-xs text-muted-foreground font-medium leading-relaxed relative z-10 serif italic">
                  Display your QR codes in well-lit areas. Our codes are designed for easy scanning in most lighting conditions.
               </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. MENU TEMPLATE SELECTION */}
      {!loading && restaurants.length > 0 && (
        <div className="space-y-8 md:space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
             <div className="space-y-3 md:space-y-4 text-center md:text-left">
                <Badge className="bg-secondary/10 text-secondary border border-secondary/20 font-black text-[9px] md:text-[10px] uppercase tracking-[0.4em] px-4 md:px-5 py-1.5 md:py-2 rounded-full w-fit mx-auto md:mx-0">
                   Menu Design
                </Badge>
                <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-foreground uppercase">
                   Menu <span className="text-muted-foreground italic font-serif lowercase tracking-normal">templates</span>
                </h2>
                <p className="text-muted-foreground font-medium max-w-md italic serif text-base">
                   "Choose the design that best represents your restaurant's style and brand."
                </p>
             </div>
          </div>

          <div className="grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-3">
             {/* Template 1: Classic */}
             <div className="flex flex-col gap-4">
                <button 
                  onClick={() => handleTemplateChange(1)}
                  disabled={updatingTemplate}
                  className={cn(
                    "relative group text-left p-1 rounded-2xl md:rounded-[3rem] transition-all overflow-hidden flex-1",
                    currentTemplate === 1 
                      ? "bg-primary shadow-[0_30px_60px_-12px_rgba(230,57,70,0.3)] scale-[1.02]" 
                      : "bg-card/40 hover:bg-card/60 grayscale-[0.8] hover:grayscale-0"
                  )}
                >
                  <div className="bg-background/90 rounded-[1.4rem] md:rounded-[2.9rem] p-6 md:p-8 h-full space-y-4 md:space-y-6 flex flex-col">
                    <div className={cn(
                        "h-12 w-12 md:h-16 md:w-16 rounded-2xl md:rounded-3xl flex items-center justify-center transition-all",
                        currentTemplate === 1 ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                    )}>
                        <Sparkles className="h-6 w-6 md:h-8 md:w-8" />
                    </div>
                    <div className="space-y-2 flex-1">
                        <h4 className="text-lg md:text-xl font-black uppercase tracking-tighter text-foreground">Classic Elegant</h4>
                        <p className="text-muted-foreground text-[11px] md:text-xs leading-relaxed font-medium">Fine-dining focus with serif typography and spacious layouts for luxury establishments.</p>
                    </div>
                    {currentTemplate === 1 && (
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
                   onClick={() => setPreviewTemplate(1)}
                   className="rounded-full font-black text-[9px] md:text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary gap-2"
                >
                   <Eye className="h-3.5 w-3.5" /> Preview Template
                </Button>
             </div>

             {/* Template 2: Modern */}
             <div className="flex flex-col gap-4">
                <button 
                  onClick={() => handleTemplateChange(2)}
                  disabled={updatingTemplate}
                  className={cn(
                    "relative group text-left p-1 rounded-2xl md:rounded-[3rem] transition-all overflow-hidden flex-1",
                    currentTemplate === 2 
                      ? "bg-primary shadow-[0_30px_60px_-12px_rgba(230,57,70,0.3)] scale-[1.02]" 
                      : "bg-card/40 hover:bg-card/60 grayscale-[0.8] hover:grayscale-0"
                  )}
                >
                  <div className="bg-background/90 rounded-[1.4rem] md:rounded-[2.9rem] p-6 md:p-8 h-full space-y-4 md:space-y-6 flex flex-col">
                    <div className={cn(
                        "h-12 w-12 md:h-16 md:w-16 rounded-2xl md:rounded-3xl flex items-center justify-center transition-all",
                        currentTemplate === 2 ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                    )}>
                        <Palette className="h-6 w-6 md:h-8 md:w-8" />
                    </div>
                    <div className="space-y-2 flex-1">
                        <h4 className="text-lg md:text-xl font-black uppercase tracking-tighter text-foreground">Modern Visual</h4>
                        <p className="text-muted-foreground text-[11px] md:text-xs leading-relaxed font-medium">Image-forward grid layout optimized for Instagram-friendly casual dining and trendy cafes.</p>
                    </div>
                    {currentTemplate === 2 && (
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
                   onClick={() => setPreviewTemplate(2)}
                   className="rounded-full font-black text-[9px] md:text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary gap-2"
                >
                   <Eye className="h-3.5 w-3.5" /> Preview Template
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
        <DialogContent className="max-w-[100vw] md:max-w-[95vw] w-full md:w-[1200px] h-full md:h-[90vh] p-0 overflow-hidden border-none rounded-none md:rounded-[3rem]">
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
                {previewTemplate === 1 && (
                   <Template1 
                      hotel={mockRestaurant} 
                      categories={mockCategories} 
                      activeCategory="c1" 
                      onCategoryChange={() => {}} 
                      onItemClick={() => {}} 
                      searchQuery="" 
                      onSearchChange={() => {}} 
                      itemsLoading={false} 
                   />
                )}
                {previewTemplate === 2 && (
                   <Template2 
                      hotel={mockRestaurant} 
                      categories={mockCategories} 
                      activeCategory="c1" 
                      onCategoryChange={() => {}} 
                      onItemClick={() => {}} 
                      searchQuery="" 
                      onSearchChange={() => {}} 
                      itemsLoading={false} 
                   />
                )}
                {previewTemplate === 3 && (
                   <Template3 
                      hotel={mockRestaurant} 
                      categories={mockCategories} 
                      activeCategory="c1" 
                      onCategoryChange={() => {}} 
                      onItemClick={() => {}} 
                      searchQuery="" 
                      onSearchChange={() => {}} 
                      itemsLoading={false} 
                   />
                )}
             </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
