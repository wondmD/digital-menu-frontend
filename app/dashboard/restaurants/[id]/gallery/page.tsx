"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import { LoadingSignal } from "@/components/ui/loading-signal"
import { Progress } from "@/components/ui/progress"
import { apiFetch, apiFetchWithProgress } from "@/lib/api-client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Save, Upload, X, ImageIcon, Plus } from "lucide-react"
import { getImageUrl, getImageUrls } from "@/lib/utils"
import { findRestaurantById } from "@/lib/restaurant-normalizers"

function isNotFoundError(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const msg = err.message.toLowerCase()
  return msg.includes("404") || msg.includes("not found")
}

export default function GalleryPage() {
  const params = useParams()
  const id = params.id as string
  const { data: session } = useSession()
  const token = (session?.user as any)?.accessToken
  const { toast } = useToast()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [initialGallery, setInitialGallery] = useState<string[]>([])
  const [keepGalleryUrls, setKeepGalleryUrls] = useState<string[]>([])
  const [newImages, setNewImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])

  const load = async () => {
    if (!token || !id) return
    try {
      setLoading(true)
      const res = await apiFetch<any>("/my-restaurants", { token })
      const d = findRestaurantById(res, id)

      if (d) {
        // Robust gallery lookup
        const source =
          (Array.isArray(d.gallery) && d.gallery.length ? d.gallery : null) ||
          (d.gallery_urls?.length ? d.gallery_urls : null) ||
          (d.gallery_image_urls?.length ? d.gallery_image_urls : null) ||
          (d.gallery_images?.length ? d.gallery_images : null) ||
          (d.photos?.length ? d.photos : null) ||
          (d.images?.length ? d.images : null)

        const urls = getImageUrls(source)
        setInitialGallery(urls)
        setKeepGalleryUrls(urls)
      } else {
        throw new Error("Restaurant not found in your account")
      }
    } catch (err: any) {
      console.error("Fetch error:", err)
      toast({ 
        title: "Error", 
        description: `Failed to load gallery: ${err.message}`, 
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [token, id])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setNewImages(prev => [...prev, ...files])
    const newPreviews = files.map(f => URL.createObjectURL(f))
    setPreviews(prev => [...prev, ...newPreviews])
  }

  const removeKeepUrl = (url: string) => {
    setKeepGalleryUrls(prev => prev.filter(u => u !== url))
  }

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!token || !id) return

    try {
      setSaving(true)
      setUploadProgress(0)
      const removedUrls = initialGallery.filter((url) => !keepGalleryUrls.includes(url))

      if (removedUrls.length === 0 && newImages.length === 0) {
        toast({ title: "No changes", description: "Gallery is already up to date." })
        return
      }

      let usePatchFallback = false

      if (removedUrls.length > 0) {
        try {
          await apiFetch(`/my-restaurants/${id}/gallery`, {
            method: "DELETE",
            token,
            body: { image_urls: removedUrls },
          })
        } catch (err) {
          if (isNotFoundError(err)) {
            usePatchFallback = true
          } else {
            throw err
          }
        }
      }

      if (newImages.length > 0 && !usePatchFallback) {
        const uploadFormData = new FormData()
        newImages.forEach((file) => {
          uploadFormData.append("gallery_images", file)
        })

        const uploadMethod = keepGalleryUrls.length === 0 ? "PUT" : "POST"

        try {
          await apiFetchWithProgress(`/my-restaurants/${id}/gallery`, {
            method: uploadMethod,
            token,
            body: uploadFormData,
            onProgress: (p) => setUploadProgress(p),
          })
        } catch (err) {
          if (isNotFoundError(err)) {
            usePatchFallback = true
          } else {
            throw err
          }
        }
      }

      if (usePatchFallback) {
        if (removedUrls.length > 0) {
          toast({
            title: "Partial support on this backend",
            description: "This server version cannot remove existing gallery images from the dashboard yet. New uploads can still be added.",
            variant: "destructive",
          })
        }

        if (newImages.length === 0) {
          await load()
          return
        }

        const fallbackForm = new FormData()

        newImages.forEach((file) => {
          fallbackForm.append("gallery_images", file)
        })

        await apiFetchWithProgress(`/my-restaurants/${id}`, {
          method: "PATCH",
          token,
          body: fallbackForm,
          onProgress: (p) => setUploadProgress(p),
        })
      }

      toast({ title: "Success", description: "Gallery updated" })
      
      // Reset local state and refetch
      setNewImages([])
      setPreviews([])
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Photo Gallery</h1>
          <p className="text-muted-foreground font-medium">Showcase your restaurant's atmosphere and dishes.</p>
        </div>
        <Button asChild className="rounded-xl h-11 px-6 font-black uppercase text-[10px] tracking-widest shadow-xl">
          <label className="cursor-pointer">
            <Plus className="h-4 w-4 mr-2" /> Add Photos
            <input type="file" multiple className="hidden" accept="image/*" onChange={handleFileChange} />
          </label>
        </Button>
      </div>

      <Card className="bg-card/40 border-border/50 rounded-2xl min-h-100">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {/* Existing Images */}
            {keepGalleryUrls.map((url, idx) => (
              <div key={`keep-${idx}`} className="group relative aspect-square rounded-xl overflow-hidden bg-muted border border-border/50">
                <img src={getImageUrl(url)} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                <button 
                  onClick={() => removeKeepUrl(url)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}

            {/* New Image Previews */}
            {previews.map((url, idx) => (
              <div key={`new-${idx}`} className="group relative aspect-square rounded-xl overflow-hidden bg-muted border-2 border-primary/30">
                <img src={url} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-primary/20 pointer-events-none" />
                <button 
                  onClick={() => removeNewImage(idx)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-md bg-primary text-[8px] font-black text-white uppercase tracking-widest">
                  New
                </div>
              </div>
            ))}

            {/* Empty State / Add Button */}
            <label className="aspect-square rounded-xl border-2 border-dashed border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary">
               <Upload className="h-6 w-6" />
               <span className="text-[10px] font-black uppercase tracking-widest">Upload</span>
               <input type="file" multiple className="hidden" accept="image/*" onChange={handleFileChange} />
            </label>
          </div>

          {keepGalleryUrls.length === 0 && newImages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/40 space-y-4">
               <ImageIcon className="h-16 w-16" />
               <p className="font-medium italic">No photos in gallery yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 pt-4">
        {saving && uploadProgress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <span>Uploading gallery images</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving || (newImages.length === 0 && keepGalleryUrls.length === initialGallery.length)} className="h-12 px-8 rounded-xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">
            {saving ? <LoadingSignal size="sm" className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Gallery Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
