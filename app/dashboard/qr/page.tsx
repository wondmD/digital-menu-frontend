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
  Zap
} from "lucide-react"

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
      toast({ title: "Registry Link Copied" })
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
        title: "Template Updated",
        description: `Visual archetype ${templateId} has been synchronized.`,
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
        <p className="text-sm text-muted-foreground font-medium">Sign in to initialize the Broadcast Registry.</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-16 pb-24">
      {/* 1. BROADCAST COMMAND BANNER */}
      <div className="relative overflow-hidden rounded-[3rem] bg-card/40 border border-border/10 p-1 px-1">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent opacity-50" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between p-10 gap-8">
          <div className="space-y-4">
            <Badge className="bg-primary/10 text-primary border border-primary/20 font-black text-[10px] uppercase tracking-[0.4em] px-5 py-2 rounded-full">
              Broadcasting Interface
            </Badge>
            <h1 className="text-6xl font-black tracking-tighter text-foreground uppercase">
              Access <span className="text-muted-foreground italic font-serif lowercase tracking-normal">manifesto</span>
            </h1>
            <p className="text-muted-foreground font-medium max-w-md text-lg italic serif">
              "Establish the digital bridge between your culinary assets and the global network."
            </p>
          </div>

          <div className="flex flex-col gap-3 min-w-[280px]">
            <Label className="text-[10px] uppercase font-black tracking-[0.4em] text-muted-foreground ml-2">Active Node</Label>
            <div className="relative group">
              <Hotel className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
              <select
                className="h-16 w-full rounded-[2rem] border border-border/5 bg-background/80 backdrop-blur-md pl-14 pr-6 text-xs font-black tracking-[0.2em] text-foreground shadow-3xl focus:border-primary/40 focus:outline-none transition-all appearance-none cursor-pointer uppercase"
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
           <div className="h-24 w-24 rounded-[3rem] bg-card border border-border/10 flex items-center justify-center shadow-3xl">
              <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
           </div>
           <p className="font-black uppercase tracking-[0.5em] text-[10px] text-primary">Synchronizing Broadcast Signal...</p>
        </div>
      ) : !restaurants.length ? (
        <div className="py-40 text-center bg-muted/20 rounded-[4rem] border-2 border-dashed border-border/10 group hover:border-primary/20 transition-all">
          <div className="h-32 w-32 rounded-[3.5rem] bg-card border border-border/10 flex items-center justify-center mx-auto mb-10 shadow-3xl group-hover:scale-110 transition-transform duration-700">
            <QrCode className="h-12 w-12 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <h3 className="text-4xl font-black tracking-tight text-foreground mb-6 uppercase">Registry Offline.</h3>
          <p className="text-muted-foreground font-medium max-w-sm mx-auto mb-12 text-lg leading-relaxed italic serif">
            Establish your primary establishment within the hierarchy to initialize operational access portals.
          </p>
          <Button asChild className="h-20 px-16 rounded-[2rem] bg-primary text-white font-black uppercase text-xs tracking-[0.3em] hover:scale-105 transition-all shadow-[0_25px_50px_-12px_rgba(230,57,70,0.4)]">
             <Link href="/dashboard">Establish Node</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Main Card: Broadcast Link */}
          <Card className="lg:col-span-7 bg-card/40 backdrop-blur-3xl border-border/10 shadow-2xl rounded-[4rem] overflow-hidden border-2">
            <CardHeader className="p-16 flex flex-row items-center justify-between border-b border-border/10">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-secondary animate-pulse shadow-[0_0_10px_#22c55e]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-secondary">Signal Status: Encrypted</span>
                </div>
                <div>
                   <CardTitle className="text-5xl font-black tracking-tighter text-foreground uppercase leading-none">Access Portal</CardTitle>
                   <p className="text-muted-foreground mt-4 text-lg font-medium italic serif max-w-xs leading-relaxed">
                      "A direct photonic bridge to your culinary atmosphere."
                   </p>
                </div>
              </div>
              <div className="h-24 w-24 rounded-[2.5rem] bg-muted/50 border border-border/10 flex items-center justify-center shadow-3xl">
                <Share2 className="h-10 w-10 text-primary" />
              </div>
            </CardHeader>

            <CardContent className="p-16 space-y-12">
              <div className="space-y-6">
                <Label className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground ml-2">Cryptographic Entry Link</Label>
                <div className="flex gap-4">
                  <div className="flex-1 h-20 bg-muted/30 rounded-[2rem] border border-border/5 flex items-center px-8 font-black text-sm tracking-widest text-primary truncate shadow-inner">
                    {menuUrl}
                  </div>
                  <Button 
                    variant="ghost" 
                    onClick={handleCopy}
                    className="h-20 w-20 rounded-[2rem] bg-muted border border-border/10 hover:bg-primary/10 hover:border-primary/20 transition-all group"
                  >
                    <Copy className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-6">
                 <div className="p-8 rounded-[2.5rem] bg-muted/10 border border-border/5 group hover:border-primary/20 transition-all">
                    <div className="h-14 w-14 rounded-2xl bg-card border border-border/10 flex items-center justify-center mb-6 group-hover:bg-primary transition-all">
                       <Smartphone className="h-6 w-6 text-muted-foreground group-hover:text-white" />
                    </div>
                    <h5 className="text-xs font-black uppercase tracking-[0.3em] text-foreground mb-2">Mobile Array</h5>
                    <p className="text-[10px] text-muted-foreground font-medium leading-relaxed uppercase tracking-widest">Variable signal optimization for global latency.</p>
                 </div>
                 <div className="p-8 rounded-[2.5rem] bg-muted/10 border border-border/5 group hover:border-primary/20 transition-all">
                    <div className="h-14 w-14 rounded-2xl bg-card border border-border/10 flex items-center justify-center mb-6 group-hover:bg-primary transition-all">
                       <QrCode className="h-6 w-6 text-muted-foreground group-hover:text-white" />
                    </div>
                    <h5 className="text-xs font-black uppercase tracking-[0.3em] text-foreground mb-2">Static Key</h5>
                    <p className="text-[10px] text-muted-foreground font-medium leading-relaxed uppercase tracking-widest">High-fidelity structural integrity for physical print.</p>
                 </div>
              </div>
            </CardContent>
          </Card>

          {/* QR Side Card: Manifest */}
          <div className="lg:col-span-5 space-y-10">
            <Card className="bg-card border-2 border-border/10 rounded-[4.5rem] p-16 flex flex-col items-center shadow-3xl relative overflow-hidden group">
               <div className="absolute inset-0 bg-primary/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
               <div className="relative z-10 p-6 rounded-[3.5rem] bg-white shadow-[0_0_120px_rgba(255,255,255,0.08)]">
                 <div className="h-72 w-72 bg-white rounded-[2rem] flex items-center justify-center p-4">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(menuUrl)}`}
                      alt="Registry QR"
                      className="h-64 w-64"
                    />
                 </div>
               </div>
               
               <div className="mt-16 space-y-10 w-full relative z-10 text-center">
                  <div className="space-y-3">
                    <h4 className="text-3xl font-black tracking-tighter text-foreground uppercase">Manifest Key</h4>
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground">Registry Encryption portal</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <Button 
                        className="w-full h-20 rounded-[2rem] bg-primary text-white font-black uppercase text-xs tracking-[0.4em] hover:bg-primary/90 transition-all shadow-[0_20px_50px_-15px_rgba(230,57,70,0.5)]" 
                        asChild
                    >
                       <a href={`https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(menuUrl)}`} download="MenuManifest.png" target="_blank">
                          <Download className="h-5 w-5 mr-4" /> Export Manifest
                       </a>
                    </Button>
                    <Button 
                        variant="ghost" 
                        className="w-full h-20 rounded-[2rem] border border-border/10 bg-muted/30 font-black uppercase text-xs tracking-[0.4em] text-muted-foreground hover:text-foreground hover:bg-muted transition-all" 
                        onClick={() => window.print()}
                    >
                        <Printer className="h-5 w-5 mr-4" /> Physical Print
                    </Button>
                  </div>
               </div>
            </Card>

            <div className="p-10 rounded-[3rem] bg-primary/10 border border-primary/20 space-y-4 relative overflow-hidden">
               <div className="absolute top-0 right-0 h-32 w-32 bg-primary/10 blur-[60px] rounded-full" />
               <div className="flex items-center gap-4 text-primary relative z-10">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                  <p className="text-[10px] font-black uppercase tracking-[0.5em]">Protocol Directive</p>
               </div>
               <p className="text-xs text-muted-foreground font-medium leading-relaxed relative z-10 serif italic">
                  "Ensure manifest placement at high-photonic intensity zones. Our signal integrity is guaranteed across 99% of atmospheric conditions."
               </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. VISUAL ARCHETYPE SELECTION */}
      {!loading && restaurants.length > 0 && (
        <div className="space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
             <div className="space-y-4">
                <Badge className="bg-secondary/10 text-secondary border border-secondary/20 font-black text-[10px] uppercase tracking-[0.4em] px-5 py-2 rounded-full w-fit">
                   User Interface Protocol
                </Badge>
                <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase">
                   Menu <span className="text-muted-foreground italic font-serif lowercase tracking-normal">archetypes</span>
                </h2>
                <p className="text-muted-foreground font-medium max-w-md italic serif">
                   "Select the psychological bridge that best connects your brand to the guest's perception."
                </p>
             </div>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
             {/* Template 1: Classic */}
             <button 
                onClick={() => handleTemplateChange(1)}
                disabled={updatingTemplate}
                className={cn(
                  "relative group text-left p-1 rounded-[3rem] transition-all overflow-hidden",
                  currentTemplate === 1 
                    ? "bg-primary shadow-[0_30px_60px_-12px_rgba(230,57,70,0.3)] scale-[1.02]" 
                    : "bg-card/40 hover:bg-card/60 grayscale-[0.8] hover:grayscale-0"
                )}
             >
                <div className="bg-background/90 rounded-[2.9rem] p-8 h-full space-y-6 flex flex-col">
                   <div className={cn(
                      "h-16 w-16 rounded-3xl flex items-center justify-center transition-all",
                      currentTemplate === 1 ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                   )}>
                      <Sparkles className="h-8 w-8" />
                   </div>
                   <div className="space-y-2 flex-1">
                      <h4 className="text-xl font-black uppercase tracking-tighter text-foreground">Classic Elegant</h4>
                      <p className="text-muted-foreground text-xs leading-relaxed font-medium">Fine-dining focus with serif typography and spacious layouts for luxury establishments.</p>
                   </div>
                   {currentTemplate === 1 && (
                     <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Active Protocol
                     </div>
                   )}
                </div>
             </button>

             {/* Template 2: Modern */}
             <button 
                onClick={() => handleTemplateChange(2)}
                disabled={updatingTemplate}
                className={cn(
                  "relative group text-left p-1 rounded-[3rem] transition-all overflow-hidden",
                  currentTemplate === 2 
                    ? "bg-primary shadow-[0_30px_60px_-12px_rgba(230,57,70,0.3)] scale-[1.02]" 
                    : "bg-card/40 hover:bg-card/60 grayscale-[0.8] hover:grayscale-0"
                )}
             >
                <div className="bg-background/90 rounded-[2.9rem] p-8 h-full space-y-6 flex flex-col">
                   <div className={cn(
                      "h-16 w-16 rounded-3xl flex items-center justify-center transition-all",
                      currentTemplate === 2 ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                   )}>
                      <Palette className="h-8 w-8" />
                   </div>
                   <div className="space-y-2 flex-1">
                      <h4 className="text-xl font-black uppercase tracking-tighter text-foreground">Modern Visual</h4>
                      <p className="text-muted-foreground text-xs leading-relaxed font-medium">Image-forward grid layout optimized for Instagram-friendly casual dining and trendy cafes.</p>
                   </div>
                   {currentTemplate === 2 && (
                     <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Active Protocol
                     </div>
                   )}
                </div>
             </button>

             {/* Template 3: Fast */}
             <button 
                onClick={() => handleTemplateChange(3)}
                disabled={updatingTemplate}
                className={cn(
                  "relative group text-left p-1 rounded-[3rem] transition-all overflow-hidden",
                  currentTemplate === 3 
                    ? "bg-primary shadow-[0_30px_60px_-12px_rgba(230,57,70,0.3)] scale-[1.02]" 
                    : "bg-card/40 hover:bg-card/60 grayscale-[0.8] hover:grayscale-0"
                )}
             >
                <div className="bg-background/90 rounded-[2.9rem] p-8 h-full space-y-6 flex flex-col">
                   <div className={cn(
                      "h-16 w-16 rounded-3xl flex items-center justify-center transition-all",
                      currentTemplate === 3 ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                   )}>
                      <Zap className="h-8 w-8" />
                   </div>
                   <div className="space-y-2 flex-1">
                      <h4 className="text-xl font-black uppercase tracking-tighter text-foreground">Fast & Minimal</h4>
                      <p className="text-muted-foreground text-xs leading-relaxed font-medium">High-efficiency list view for QSR, bars, and bistros where speed of selection is priority.</p>
                   </div>
                   {currentTemplate === 3 && (
                     <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Active Protocol
                     </div>
                   )}
                </div>
             </button>
          </div>
        </div>
      )}
    </div>
  )
}
