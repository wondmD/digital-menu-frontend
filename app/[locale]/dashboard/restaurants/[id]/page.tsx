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
import { Save, Instagram, Facebook, Twitter, Send } from "lucide-react"
import { LoadingSignal } from "@/components/ui/loading-signal"
import { Switch } from "@/components/ui/switch"
import { DEFAULT_TIMEZONE, normalizeRestaurantList } from "@/lib/restaurant-normalizers"

type SocialPlatformKey =
  | "instagram"
  | "facebook"
  | "twitter"
  | "tiktok"
  | "telegram"
  | "whatsapp"

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.35V2h-3.4v13.13a2.9 2.9 0 1 1-2-2.77V8.9a6.3 6.3 0 1 0 5.4 6.23v-6.67a8.2 8.2 0 0 0 4.77 1.53V6.69z" />
    </svg>
  )
}

function findRestaurantByRouteId(input: any, routeId: string) {
  const list = normalizeRestaurantList(input)
  return list.find((item) => item.id === routeId || item.slug === routeId) || null
}

function parseSocialLinks(value: unknown): Record<string, string> {
  if (!value) return {}
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {}
    } catch {
      return {}
    }
  }

  return typeof value === "object" ? (value as Record<string, string>) : {}
}

function normalizeSocialUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ""
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function extractHandle(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ""

  // Already a handle-like value
  if (!trimmed.includes("/") && !trimmed.includes(".")) {
    return trimmed.replace(/^@/, "")
  }

  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    const url = new URL(withProtocol)
    const pathParts = url.pathname.split("/").filter(Boolean)
    if (pathParts.length === 0) return ""

    // tiktok.com/@handle, twitter.com/handle, instagram.com/handle, t.me/handle
    const candidate = pathParts[pathParts.length - 1] || ""
    return candidate.replace(/^@/, "")
  } catch {
    return trimmed.replace(/^@/, "")
  }
}

function buildSocialUrl(platform: "instagram" | "facebook" | "twitter" | "tiktok" | "telegram", handle: string): string {
  const cleaned = handle.trim().replace(/^@/, "")
  if (!cleaned) return ""

  switch (platform) {
    case "instagram":
      return `https://instagram.com/${cleaned}`
    case "facebook":
      return `https://facebook.com/${cleaned}`
    case "twitter":
      return `https://x.com/${cleaned}`
    case "tiktok":
      return `https://tiktok.com/@${cleaned}`
    case "telegram":
      return `https://t.me/${cleaned}`
    default:
      return ""
  }
}

const SOCIAL_PLATFORM_OPTIONS: Array<{ key: SocialPlatformKey; label: string }> = [
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "twitter", label: "X / Twitter" },
  { key: "tiktok", label: "TikTok" },
  { key: "telegram", label: "Telegram" },
  { key: "whatsapp", label: "WhatsApp" },
]

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
  const [addedSocialPlatforms, setAddedSocialPlatforms] = useState<SocialPlatformKey[]>([])
  const [platformToAdd, setPlatformToAdd] = useState<SocialPlatformKey>("instagram")
  const [data, setData] = useState({
    slug: "",
    name: "",
    description: "",
    history: "",
    cuisine_type: "",
    operation_time: "",
    year_established: "",
    template_number: "1",
    website: "",
    social_instagram: "",
    social_facebook: "",
    social_twitter: "",
    social_tiktok: "",
    social_telegram: "",
    social_whatsapp: "",
    timezone: DEFAULT_TIMEZONE,
    is_published: false,
  })

  const getSocialValue = (platform: SocialPlatformKey) => {
    switch (platform) {
      case "instagram":
        return data.social_instagram
      case "facebook":
        return data.social_facebook
      case "twitter":
        return data.social_twitter
      case "tiktok":
        return data.social_tiktok
      case "telegram":
        return data.social_telegram
      case "whatsapp":
        return data.social_whatsapp
      default:
        return ""
    }
  }

  const setSocialValue = (platform: SocialPlatformKey, value: string) => {
    switch (platform) {
      case "instagram":
        setData((d) => ({ ...d, social_instagram: value }))
        break
      case "facebook":
        setData((d) => ({ ...d, social_facebook: value }))
        break
      case "twitter":
        setData((d) => ({ ...d, social_twitter: value }))
        break
      case "tiktok":
        setData((d) => ({ ...d, social_tiktok: value }))
        break
      case "telegram":
        setData((d) => ({ ...d, social_telegram: value }))
        break
      case "whatsapp":
        setData((d) => ({ ...d, social_whatsapp: value }))
        break
    }
  }

  const renderSocialIcon = (platform: SocialPlatformKey) => {
    switch (platform) {
      case "instagram":
        return <Instagram className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      case "facebook":
        return <Facebook className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      case "twitter":
        return <Twitter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      case "tiktok":
        return <TikTokIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      case "telegram":
        return <Send className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      case "whatsapp":
        return <span className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[11px] font-black text-muted-foreground">WA</span>
      default:
        return null
    }
  }

  const socialPlaceholder = (platform: SocialPlatformKey) => {
    if (platform === "whatsapp") return "2519XXXXXXXX"
    return "username"
  }

  const load = async () => {
    if (!token || !id) return
    try {
      setLoading(true)
      const res = await apiFetch<any>("/my-restaurants", { token })
      const d = findRestaurantByRouteId(res, id)
      
      if (d) {
        const links = parseSocialLinks(d.social_links)
        setCanonicalRestaurantId(String(d.id || id))
        setData({
          slug: d.slug || "",
          name: d.name || "",
          description: d.description || "",
          history: d.history || "",
          cuisine_type: d.cuisine_type || "",
          operation_time: d.operation_time || d.opening_hours || "",
          year_established: d.year_established ? String(d.year_established) : "",
          template_number: d.template_number ? String(d.template_number) : "1",
          website: d.website || "",
          social_instagram: extractHandle(d.instagram_url || links.instagram || links.instagram_url || ""),
          social_facebook: extractHandle(d.facebook_url || links.facebook || links.facebook_url || ""),
          social_twitter: extractHandle(d.twitter_url || links.twitter || links.twitter_url || ""),
          social_tiktok: extractHandle(d.tiktok_url || links.tiktok || links.tiktok_url || ""),
          social_telegram: extractHandle(d.telegram_url || links.telegram || links.telegram_url || ""),
          social_whatsapp: d.whatsapp || links.whatsapp || links.whatsapp_url || "",
          timezone: d.timezone || DEFAULT_TIMEZONE,
          is_published: Boolean(d.is_published),
        })

        const existingPlatforms: SocialPlatformKey[] = []
        if (extractHandle(d.instagram_url || links.instagram || links.instagram_url || "")) existingPlatforms.push("instagram")
        if (extractHandle(d.facebook_url || links.facebook || links.facebook_url || "")) existingPlatforms.push("facebook")
        if (extractHandle(d.twitter_url || links.twitter || links.twitter_url || "")) existingPlatforms.push("twitter")
        if (extractHandle(d.tiktok_url || links.tiktok || links.tiktok_url || "")) existingPlatforms.push("tiktok")
        if (extractHandle(d.telegram_url || links.telegram || links.telegram_url || "")) existingPlatforms.push("telegram")
        if (d.whatsapp || links.whatsapp || links.whatsapp_url) existingPlatforms.push("whatsapp")

        setAddedSocialPlatforms(existingPlatforms)
        const firstMissing = SOCIAL_PLATFORM_OPTIONS.find((option) => !existingPlatforms.includes(option.key))
        if (firstMissing) setPlatformToAdd(firstMissing.key)
      } else {
        throw new Error("Restaurant not found in your account")
      }
    } catch (err: any) {
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
      const normalizedOperationTime = data.operation_time.trim()
      const normalizedYearEstablished = data.year_established.trim()
      const normalizedTemplateNumber = data.template_number.trim()
      const socialLinksPayload = {
        instagram: buildSocialUrl("instagram", data.social_instagram),
        facebook: buildSocialUrl("facebook", data.social_facebook),
        twitter: buildSocialUrl("twitter", data.social_twitter),
        tiktok: buildSocialUrl("tiktok", data.social_tiktok),
        telegram: buildSocialUrl("telegram", data.social_telegram),
        whatsapp: data.social_whatsapp.trim(),
      }
      const cleanedSocialLinks = Object.fromEntries(
        Object.entries(socialLinksPayload).filter(([, value]) => Boolean(value))
      )

      const fetchVerifiedRestaurant = async () => {
        const verifyRes = await apiFetch<any>("/my-restaurants", { token })
        return findRestaurantByRouteId(verifyRes, targetRestaurantId) || findRestaurantByRouteId(verifyRes, id)
      }

      const formData = new FormData()
      formData.append("slug", normalizedSlug)
      formData.append("name", data.name.trim())
      formData.append("description", data.description || "")
      formData.append("history", data.history || "")
      formData.append("cuisine_type", normalizedCuisine)
      formData.append("operation_time", normalizedOperationTime)
      if (normalizedYearEstablished) {
        formData.append("year_established", normalizedYearEstablished)
      }
      if (normalizedTemplateNumber) {
        formData.append("template_number", normalizedTemplateNumber)
      }
      formData.append("social_links", JSON.stringify(cleanedSocialLinks))
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
        const links = parseSocialLinks(verified.social_links)
        setData((prev) => ({
          ...prev,
          slug: verified.slug || "",
          cuisine_type: verified.cuisine_type || "",
          name: verified.name || prev.name,
          description: verified.description || "",
          history: verified.history || "",
          operation_time: verified.operation_time || verified.opening_hours || "",
          year_established: verified.year_established ? String(verified.year_established) : "",
          template_number: verified.template_number ? String(verified.template_number) : prev.template_number,
          website: verified.website || "",
          social_instagram: extractHandle(verified.instagram_url || links.instagram || links.instagram_url || ""),
          social_facebook: extractHandle(verified.facebook_url || links.facebook || links.facebook_url || ""),
          social_twitter: extractHandle(verified.twitter_url || links.twitter || links.twitter_url || ""),
          social_tiktok: extractHandle(verified.tiktok_url || links.tiktok || links.tiktok_url || ""),
          social_telegram: extractHandle(verified.telegram_url || links.telegram || links.telegram_url || ""),
          social_whatsapp: verified.whatsapp || links.whatsapp || links.whatsapp_url || "",
          timezone: verified.timezone || DEFAULT_TIMEZONE,
          is_published: Boolean(verified.is_published),
        }))

        const existingPlatforms: SocialPlatformKey[] = []
        if (extractHandle(verified.instagram_url || links.instagram || links.instagram_url || "")) existingPlatforms.push("instagram")
        if (extractHandle(verified.facebook_url || links.facebook || links.facebook_url || "")) existingPlatforms.push("facebook")
        if (extractHandle(verified.twitter_url || links.twitter || links.twitter_url || "")) existingPlatforms.push("twitter")
        if (extractHandle(verified.tiktok_url || links.tiktok || links.tiktok_url || "")) existingPlatforms.push("tiktok")
        if (extractHandle(verified.telegram_url || links.telegram || links.telegram_url || "")) existingPlatforms.push("telegram")
        if (verified.whatsapp || links.whatsapp || links.whatsapp_url) existingPlatforms.push("whatsapp")
        setAddedSocialPlatforms(existingPlatforms)
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
    <div className="relative space-y-6 text-foreground">
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
                placeholder="addis-gebeya"
                onChange={e => setData(d => ({ ...d, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }))}
                className="bg-background border-border/50 h-12 rounded-xl focus:ring-primary/20 shadow-sm"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Restaurant Name</Label>
              <Input 
                value={data.name} 
                onChange={e => setData(d => ({ ...d, name: e.target.value }))}
                className="bg-background border-border/50 h-12 rounded-xl focus:ring-primary/20 shadow-sm"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Cuisine Type</Label>
              <Input 
                value={data.cuisine_type} 
                placeholder="e.g. Ethiopian, Habesha Fusion, Fast Food"
                onChange={e => setData(d => ({ ...d, cuisine_type: e.target.value }))}
                className="bg-background border-border/50 h-12 rounded-xl focus:ring-primary/20 shadow-sm"
                disabled={saving}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Operation Time</Label>
              <Input
                value={data.operation_time}
                placeholder="Daily 8:00 AM - 11:00 PM"
                onChange={e => setData(d => ({ ...d, operation_time: e.target.value }))}
                className="bg-background border-border/50 h-12 rounded-xl focus:ring-primary/20 shadow-sm"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Year Established</Label>
              <Input
                value={data.year_established}
                type="number"
                min={1900}
                max={new Date().getFullYear()}
                placeholder="2018"
                onChange={e => setData(d => ({ ...d, year_established: e.target.value }))}
                className="bg-background border-border/50 h-12 rounded-xl focus:ring-primary/20 shadow-sm"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Template Number</Label>
              <Input
                value={data.template_number}
                type="number"
                min={1}
                max={3}
                placeholder="1"
                onChange={e => setData(d => ({ ...d, template_number: e.target.value }))}
                className="bg-background border-border/50 h-12 rounded-xl focus:ring-primary/20 shadow-sm"
                disabled={saving}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Website</Label>
              <Input
                value={data.website}
                placeholder="https://addisgebeya.et"
                onChange={e => setData(d => ({ ...d, website: e.target.value }))}
                className="bg-background border-border/50 h-12 rounded-xl focus:ring-primary/20 shadow-sm"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Timezone</Label>
              <Input
                value={data.timezone}
                placeholder="Africa/Addis_Ababa"
                onChange={e => setData(d => ({ ...d, timezone: e.target.value }))}
                className="bg-background border-border/50 h-12 rounded-xl focus:ring-primary/20 shadow-sm"
                disabled={saving}
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
              placeholder="Tell your customers what makes your Ethiopian menu special..."
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-primary">History</Label>
            <Textarea
              value={data.history}
              rows={4}
              onChange={e => setData(d => ({ ...d, history: e.target.value }))}
              className="bg-background border-border/50 rounded-xl focus:ring-primary/20 shadow-sm resize-none"
              placeholder="Share your restaurant story for the public page..."
              disabled={saving}
            />
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Social Media Links</Label>
              <p className="text-[11px] text-muted-foreground mt-1">
                Add social media usernames only. Existing usernames are shown below.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="w-full sm:w-64 space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Add Social Media</Label>
                <select
                  className="h-12 w-full rounded-xl border border-border/50 bg-background px-3 text-sm font-semibold"
                  value={platformToAdd}
                  onChange={(e) => setPlatformToAdd(e.target.value as SocialPlatformKey)}
                  disabled={saving || SOCIAL_PLATFORM_OPTIONS.every((option) => addedSocialPlatforms.includes(option.key))}
                >
                  {SOCIAL_PLATFORM_OPTIONS.filter((option) => !addedSocialPlatforms.includes(option.key)).map((option) => (
                    <option key={option.key} value={option.key}>{option.label}</option>
                  ))}
                </select>
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-xl"
                disabled={
                  saving ||
                  addedSocialPlatforms.includes(platformToAdd) ||
                  SOCIAL_PLATFORM_OPTIONS.every((option) => addedSocialPlatforms.includes(option.key))
                }
                onClick={() => {
                  if (addedSocialPlatforms.includes(platformToAdd)) return
                  const next = [...addedSocialPlatforms, platformToAdd]
                  setAddedSocialPlatforms(next)
                  const firstMissing = SOCIAL_PLATFORM_OPTIONS.find((option) => !next.includes(option.key))
                  if (firstMissing) setPlatformToAdd(firstMissing.key)
                }}
              >
                Add Social Media
              </Button>
            </div>

            {addedSocialPlatforms.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {addedSocialPlatforms.map((platform) => {
                  const option = SOCIAL_PLATFORM_OPTIONS.find((item) => item.key === platform)
                  if (!option) return null
                  return (
                    <div key={platform} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary">{option.label}</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-7 px-2 text-[10px] uppercase tracking-wide"
                          disabled={saving}
                          onClick={() => {
                            setSocialValue(platform, "")
                            setAddedSocialPlatforms((prev) => prev.filter((item) => item !== platform))
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="relative">
                        {renderSocialIcon(platform)}
                        <Input
                          value={getSocialValue(platform)}
                          placeholder={socialPlaceholder(platform)}
                          onChange={(e) => {
                            const value = platform === "whatsapp" ? e.target.value : e.target.value.replace(/^@/, "")
                            setSocialValue(platform, value)
                          }}
                          className="bg-background border-border/50 h-12 rounded-xl pl-10 focus:ring-primary/20 shadow-sm"
                          disabled={saving}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-4 text-[11px] text-muted-foreground">
                No social media added yet.
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">
              Enter usernames only. We generate the full social links automatically.
            </p>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/30">
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Public Menu Status</Label>
              <p className="text-[11px] text-muted-foreground">Controls `is_published` on your restaurant record.</p>
            </div>
            <Switch checked={data.is_published} onCheckedChange={(value) => setData(d => ({ ...d, is_published: value }))} disabled={saving} />
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={saving} className="h-12 px-8 rounded-xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">
              {saving ? <LoadingSignal size="sm" className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {saving && (
        <div className="absolute inset-0 z-20 rounded-2xl bg-background/70 backdrop-blur-[2px] flex items-center justify-center">
          <LoadingSignal size="lg" message="Saving restaurant changes..." />
        </div>
      )}
    </div>
  )
}
