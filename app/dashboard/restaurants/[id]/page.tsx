"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import { apiFetch } from "@/lib/api-client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Save } from "lucide-react"
import { LoadingSignal } from "@/components/ui/loading-signal"
import { Switch } from "@/components/ui/switch"
import { DEFAULT_TIMEZONE, findRestaurantById } from "@/lib/restaurant-normalizers"

function findRestaurantByRouteId(input: any, routeId: string) {
  const list = normalizeRestaurantList(input)
  return list.find((item) => item.id === routeId || item.slug === routeId) || null
}

export default function GeneralInfoPage() {
  const params = useParams()
  const id = params.id as string
  const { data: session } = useSession()
  const token = (session?.user as any)?.accessToken
  const { toast } = useToast()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [canonicalRestaurantId, setCanonicalRestaurantId] = useState<string>(id)
  const [data, setData] = useState({
    slug: "",
    name: "",
    description: "",
    cuisine_type: "",
    website: "",
    timezone: DEFAULT_TIMEZONE,
    is_published: false,
    is_featured: false,
    view_count: 0,
    rank_score: "",
  })

  const load = async () => {
    if (!token || !id) return
    try {
      setLoading(true)
      const res = await apiFetch<any>("/my-restaurants", { token })
      const d = findRestaurantByRouteId(res, id)
      const d = findRestaurantById(res, id)
      
      if (d) {
        setCanonicalRestaurantId(String(d.id || id))
        setData({
          slug: d.slug || "",
          name: d.name || "",
          description: d.description || "",
          cuisine_type: d.cuisine_type || "",
          website: d.website || "",
          timezone: d.timezone || DEFAULT_TIMEZONE,
          is_published: Boolean(d.is_published),
          is_featured: Boolean(d.is_featured),
          view_count: Number(d.view_count || 0),
          rank_score: d.rank_score ? String(d.rank_score) : "",
        })
      } else {
        throw new Error("Restaurant not found in your account")
      }
    } catch (err: any) {
      console.error("Fetch error:", err)
      toast({ 
        title: "Error", 
        description: `Failed to load restaurant: ${err.message}`, 
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [token, id])

  const handleSave = async () => {
    if (!token || !id) return
    try {
      setSaving(true)
      const targetRestaurantId = canonicalRestaurantId || id
      const normalizedSlug = data.slug.trim().toLowerCase().replace(/\s+/g, "-")
      const normalizedCuisine = data.cuisine_type.trim()
      const fetchVerifiedRestaurant = async () => {
        const verifyRes = await apiFetch<any>("/my-restaurants", { token })
        return findRestaurantByRouteId(verifyRes, targetRestaurantId) || findRestaurantByRouteId(verifyRes, id)
      }

      const formData = new FormData()
      formData.append("slug", normalizedSlug)
      formData.append("name", data.name.trim())
      formData.append("description", data.description || "")
      formData.append("cuisine_type", normalizedCuisine)
      formData.append("website", data.website || "")
      formData.append("timezone", data.timezone || DEFAULT_TIMEZONE)
      formData.append("is_published", String(data.is_published))

      await apiFetch(`/my-restaurants/${targetRestaurantId}`, {
        method: "PATCH",
        token,
        body: formData
      })

      let verified = await fetchVerifiedRestaurant()
      let slugPersisted = (verified?.slug || "") === normalizedSlug
      let cuisinePersisted = (verified?.cuisine_type || "") === normalizedCuisine

      // Some backend builds map slug to different field names on PATCH.
      if (!slugPersisted) {
        const slugAttempts: Array<FormData | Record<string, any>> = [
          (() => {
            const fd = new FormData()
            fd.append("slug", normalizedSlug)
            return fd
          })(),
          (() => {
            const fd = new FormData()
            fd.append("restaurant_slug", normalizedSlug)
            return fd
          })(),
          (() => {
            const fd = new FormData()
            fd.append("RestaurantSlug", normalizedSlug)
            return fd
          })(),
          { slug: normalizedSlug },
          { restaurant_slug: normalizedSlug },
          { RestaurantSlug: normalizedSlug },
        ]

        for (const attemptBody of slugAttempts) {
          try {
            await apiFetch(`/my-restaurants/${targetRestaurantId}`, {
              method: "PATCH",
              token,
              body: attemptBody,
            })
            verified = await fetchVerifiedRestaurant()
            slugPersisted = (verified?.slug || "") === normalizedSlug
            if (slugPersisted) break
          } catch {
            // Ignore individual attempt failures and continue trying compatible variants.
          }
        }
      }

      verified = verified || (await fetchVerifiedRestaurant())
      cuisinePersisted = (verified?.cuisine_type || "") === normalizedCuisine
      const verifyRes = await apiFetch<any>("/my-restaurants", { token })
      const verified = findRestaurantById(verifyRes, id)
      const slugPersisted = (verified?.slug || "") === normalizedSlug
      const cuisinePersisted = (verified?.cuisine_type || "") === normalizedCuisine

      if (!slugPersisted || !cuisinePersisted) {
        const failed: string[] = []
        if (!slugPersisted) failed.push("slug")
        if (!cuisinePersisted) failed.push("cuisine_type")
        toast({
          title: "Partially updated",
          description: `Saved request, but backend did not persist: ${failed.join(", ")}`,
          variant: "destructive",
        })
      } else {
        toast({ title: "Success", description: "General information updated" })
      }

      if (verified) {
        setData((prev) => ({
          ...prev,
          slug: verified.slug || "",
          cuisine_type: verified.cuisine_type || "",
          name: verified.name || prev.name,
          description: verified.description || "",
          website: verified.website || "",
          timezone: verified.timezone || DEFAULT_TIMEZONE,
          is_published: Boolean(verified.is_published),
          is_featured: Boolean(verified.is_featured),
          view_count: Number(verified.view_count || 0),
          rank_score: verified.rank_score ? String(verified.rank_score) : "",
        }))
      }
      await load()
      router.refresh()
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setSaving(false)
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
        <h1 className="text-3xl font-bold tracking-tight">General Info</h1>
        <p className="text-muted-foreground font-medium">Basic details about your restaurant.</p>
      </div>

      <Card className="bg-card/40 border-border/50 rounded-2xl">
        <CardHeader>
          <CardTitle>Restaurant Identity</CardTitle>
          <CardDescription>Update schema-aligned core fields used by your public pages and APIs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-1">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Slug</Label>
              <Input
                value={data.slug}
                placeholder="my-restaurant"
                onChange={e => setData(d => ({ ...d, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }))}
                className="bg-background border-border/50 h-12 rounded-xl focus:ring-primary/20 shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Restaurant Name</Label>
              <Input 
                value={data.name} 
                onChange={e => setData(d => ({ ...d, name: e.target.value }))}
                className="bg-background border-border/50 h-12 rounded-xl focus:ring-primary/20 shadow-sm" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Cuisine Type</Label>
              <Input 
                value={data.cuisine_type} 
                placeholder="e.g. Italian, Ethiopian, Fast Food"
                onChange={e => setData(d => ({ ...d, cuisine_type: e.target.value }))}
                className="bg-background border-border/50 h-12 rounded-xl focus:ring-primary/20 shadow-sm" 
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Website</Label>
              <Input
                value={data.website}
                placeholder="https://restaurant.com"
                onChange={e => setData(d => ({ ...d, website: e.target.value }))}
                className="bg-background border-border/50 h-12 rounded-xl focus:ring-primary/20 shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Timezone</Label>
              <Input
                value={data.timezone}
                placeholder="Africa/Addis_Ababa"
                onChange={e => setData(d => ({ ...d, timezone: e.target.value }))}
                className="bg-background border-border/50 h-12 rounded-xl focus:ring-primary/20 shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Description</Label>
            <Textarea 
              value={data.description} 
              rows={5}
              onChange={e => setData(d => ({ ...d, description: e.target.value }))}
              className="bg-background border-border/50 rounded-xl focus:ring-primary/20 shadow-sm resize-none" 
              placeholder="Tell your customers what makes your restaurant special..."
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/30">
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Public Menu Status</Label>
              <p className="text-[11px] text-muted-foreground">Controls `is_published` on your restaurant record.</p>
            </div>
            <Switch checked={data.is_published} onCheckedChange={(value) => setData(d => ({ ...d, is_published: value }))} />
          </div>

          <div className="grid md:grid-cols-2 gap-4 p-4 rounded-xl border border-border/50 bg-card">
            <div>
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary">View Count</Label>
              <p className="text-lg font-bold mt-1">{data.view_count}</p>
            </div>
            <div>
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Rank Score</Label>
              <p className="text-lg font-bold mt-1">{data.rank_score || "—"}</p>
            </div>
            <div>
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Featured (System)</Label>
              <p className="text-lg font-bold mt-1">{data.is_featured ? "Yes" : "No"}</p>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={saving} className="h-12 px-8 rounded-xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">
              {saving ? <LoadingSignal size="sm" className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
