"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import { LoadingSignal } from "@/components/ui/loading-signal"
import { Progress } from "@/components/ui/progress"
import { apiFetch, apiFetchWithProgress } from "@/lib/api-client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Save, Upload, X, Building2, ImageIcon } from "lucide-react"
import { getImageUrl } from "@/lib/utils"
import { findRestaurantById } from "@/lib/restaurant-normalizers"

const PREDEFINED_THEMES = [
  {
    id: "classic-elegance",
    name: "Classic Elegance",
    description: "Warm, premium dining look with subtle contrast.",
    settings: { preset: "classic-elegance", primary: "#B45309", accent: "#F59E0B", surface: "light" },
  },
  {
    id: "modern-luxe",
    name: "Modern Luxe",
    description: "Dark, bold style for upscale modern restaurants.",
    settings: { preset: "modern-luxe", primary: "#E11D48", accent: "#FB7185", surface: "dark" },
  },
  {
    id: "fresh-organic",
    name: "Fresh Organic",
    description: "Soft and natural palette for healthy/organic brands.",
    settings: { preset: "fresh-organic", primary: "#15803D", accent: "#4ADE80", surface: "light" },
  },
  {
    id: "royal-night",
    name: "Royal Night",
    description: "High-contrast evening dining with elegant highlights.",
    settings: { preset: "royal-night", primary: "#4338CA", accent: "#818CF8", surface: "dark" },
  },
] as const

export default function BrandingPage() {
  const params = useParams()
  const id = params.id as string
  const { data: session } = useSession()
  const token = (session?.user as any)?.accessToken
  const { toast } = useToast()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [draft, setDraft] = useState<{ logo: File | null; cover: File | null }>({ logo: null, cover: null })
  const [previews, setPreviews] = useState<{ logo: string | null; cover: string | null }>({ logo: null, cover: null })
  const [selectedThemeId, setSelectedThemeId] = useState<string>(PREDEFINED_THEMES[0].id)

  const load = async () => {
    if (!token || !id) return
    try {
      setLoading(true)
      // Direct GET /my-restaurants/:id 404s, so we use the list.
      const res = await apiFetch<any>("/my-restaurants", { token })
      const d = findRestaurantById(res, id)

      if (d) {
        setPreviews({
          logo: d.logo_url || null,
          cover: d.cover_image_url || null
        })
        const preset = d.theme_settings?.preset
        const matched = PREDEFINED_THEMES.find((theme) => theme.id === preset)
        if (matched) {
          setSelectedThemeId(matched.id)
        }
      } else {
        throw new Error("Restaurant not found in your account")
      }
    } catch (err: any) {
      console.error("Fetch error:", err)
      toast({ 
        title: "Error", 
        description: `Failed to load branding: ${err.message}`, 
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [token, id])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
    const file = e.target.files?.[0]
    if (file) {
      setDraft(d => ({ ...d, [type]: file }))
      setPreviews(p => ({ ...p, [type]: URL.createObjectURL(file) }))
    }
  }

  const handleSave = async () => {
    if (!token || !id) return
    try {
      setSaving(true)
      setUploadProgress(0)
      const formData = new FormData()
      const selectedTheme = PREDEFINED_THEMES.find((theme) => theme.id === selectedThemeId) || PREDEFINED_THEMES[0]
      formData.append("theme_settings", JSON.stringify(selectedTheme.settings))
      if (draft.logo) {
        formData.append("logo", draft.logo)
      }
      if (draft.cover) {
        formData.append("cover", draft.cover)
      }

      console.log("[Branding] Saving visuals with keys:", Array.from(formData.keys()))

      await apiFetchWithProgress(`/my-restaurants/${id}`, {
        method: "PATCH",
        token,
        body: formData,
        onProgress: (p) => setUploadProgress(p)
      })
      toast({ title: "Success", description: "Visuals updated successfully" })
      setDraft({ logo: null, cover: null }) // Reset draft after successful save
      await load()
      router.refresh()
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setSaving(false)
      setUploadProgress(0)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSignal />
      </div>
    )
  }

  return (
    <div className="space-y-6 text-foreground">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Branding & Visuals</h1>
        <p className="text-muted-foreground font-medium">Manage how your restaurant looks to customers.</p>
      </div>

      <div className="grid gap-6">
        {/* Logo Section */}
        <Card className="bg-card/40 border-border/50 rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle>Restaurant Logo</CardTitle>
            <CardDescription>This appears on your menu and in search results.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="h-32 w-32 rounded-2xl bg-muted border-2 border-dashed border-border flex items-center justify-center relative overflow-hidden group">
                {previews.logo ? (
                  <img src={getImageUrl(previews.logo)} className="h-full w-full object-cover" />
                ) : (
                  <Building2 className="h-10 w-10 text-muted-foreground/40" />
                )}
                <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Upload className="h-6 w-6 text-white" />
                  <input type="file" className="hidden" accept="image/*" onChange={e => handleFileChange(e, 'logo')} />
                </label>
              </div>
              <div className="space-y-4 text-center md:text-left">
                <p className="text-sm text-muted-foreground max-w-xs">
                  Recommended size: 512x512px. <br/>
                  Supported formats: PNG, JPG, WEBP.
                </p>
                <div className="flex gap-2 justify-center md:justify-start">
                   <Button variant="outline" size="sm" asChild className="rounded-xl">
                      <label className="cursor-pointer">
                        Change Logo
                        <input type="file" className="hidden" accept="image/*" onChange={e => handleFileChange(e, 'logo')} />
                      </label>
                   </Button>
                   {previews.logo && (
                     <Button variant="ghost" size="sm" className="rounded-xl text-destructive hover:bg-destructive/10" onClick={() => {
                        setDraft(d => ({ ...d, logo: null }));
                        setPreviews(p => ({ ...p, logo: null }));
                     }}>
                        Remove
                     </Button>
                   )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cover Section */}
        <Card className="bg-card/40 border-border/50 rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle>Cover Image</CardTitle>
            <CardDescription>Hero image displayed at the top of your menu.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="relative h-48 w-full rounded-2xl bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden group font-black">
              {previews.cover ? (
                <img src={getImageUrl(previews.cover)} className="h-full w-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground/40 uppercase tracking-widest text-[10px]">
                   <ImageIcon className="h-10 w-10" />
                   Add Cover Photo
                </div>
              )}
              <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Upload className="h-8 w-8 text-white" />
                <input type="file" className="hidden" accept="image/*" onChange={e => handleFileChange(e, 'cover')} />
              </label>
            </div>
            
            <div className="flex justify-between items-center">
               <p className="text-sm text-muted-foreground italic font-medium">
                  High quality landscape photos (16:9) work best.
               </p>
               <div className="flex gap-2">
                 <Button variant="outline" size="sm" asChild className="rounded-xl">
                    <label className="cursor-pointer font-bold uppercase text-[9px] tracking-widest">
                       Upload Cover
                       <input type="file" className="hidden" accept="image/*" onChange={e => handleFileChange(e, 'cover')} />
                    </label>
                 </Button>
               </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button onClick={handleSave} disabled={saving} className="h-12 px-8 rounded-xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">
            {saving ? <LoadingSignal size="sm" className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Branding Changes
          </Button>
        </div>

        <Card className="bg-card/40 border-border/50 rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle>Theme Style</CardTitle>
            <CardDescription>Choose a predefined visual theme. This saves to `theme_settings` automatically.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            {PREDEFINED_THEMES.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => setSelectedThemeId(theme.id)}
                className={`text-left p-4 rounded-xl border transition-all ${selectedThemeId === theme.id ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/40"}`}
              >
                <p className="font-bold text-sm">{theme.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{theme.description}</p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="h-4 w-4 rounded-full border" style={{ backgroundColor: theme.settings.primary }} />
                  <span className="h-4 w-4 rounded-full border" style={{ backgroundColor: theme.settings.accent }} />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{theme.settings.surface}</span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
