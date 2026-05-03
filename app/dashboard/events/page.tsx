"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { LoadingSignal } from "@/components/ui/loading-signal"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { apiFetch, apiFetchWithProgress } from "@/lib/api-client"
import { CalendarDays, Loader2, Plus, Edit2, Trash2, Upload, ImageIcon } from "lucide-react"
import { getOversizedFiles, MAX_UPLOAD_SIZE_BYTES, getImageUrl } from "@/lib/utils"

type Restaurant = { id: string; name: string; slug?: string }
type EventItem = {
  id?: string
  title?: string
  name?: string
  start_date?: string
  date?: string
  end_date?: string
  start_time?: string
  end_time?: string
  description?: string
  image_url?: string
  image_urls?: string[]
  href?: string
  time?: string
  price?: string
  location?: string
  timezone?: string
  is_active?: boolean
}

type EventDraft = EventItem & {
  imageFile?: File | null
  imagePreview?: string | null
}

function normalizeRestaurant(row: any): Restaurant {
  const id = String(row?.id || row?.restaurant_id || row?.uuid || "")
  return { ...row, id, name: String(row?.name || row?.restaurant_name || "Restaurant") }
}

function normalizeEvent(row: any): EventItem {
  const id = String(row?.id || row?.event_id || row?.uuid || "")
  const title = String(row?.title || row?.name || row?.event_name || "")
  const imageUrls = Array.isArray(row?.image_urls)
    ? row.image_urls.filter(Boolean).map((value: any) => String(value))
    : []

  return {
    ...row,
    id,
    title,
    name: title,
    date: String(row?.date || row?.start_date || ""),
    start_date: String(row?.start_date || row?.date || ""),
    end_date: String(row?.end_date || row?.start_date || row?.date || ""),
    time: String(row?.time || row?.start_time || ""),
    start_time: String(row?.start_time || row?.time || ""),
    end_time: String(row?.end_time || row?.start_time || row?.time || ""),
    description: String(row?.description || ""),
    image_url: String(row?.image_url || imageUrls[0] || ""),
    image_urls: imageUrls,
    href: String(row?.href || ""),
    location: String(row?.location || ""),
    timezone: String(row?.timezone || "Africa/Addis_Ababa"),
    is_active: Boolean(row?.is_active ?? true),
  }
}

function extractList(payload: any): any[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.items)) return payload.data.items
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

function getMediaUrl(payload: any) {
  return String(payload?.data?.url || payload?.data?.data?.url || payload?.url || "")
}

export default function DashboardEventsPage() {
  const { data: session, status } = useSession()
  const token = (session?.user as any)?.accessToken as string | undefined
  const { toast } = useToast()

  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedId, setSelectedId] = useState<string>("")
  const [loadingRestaurants, setLoadingRestaurants] = useState(true)
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [events, setEvents] = useState<EventItem[]>([])

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editing, setEditing] = useState<EventDraft | null>(null)

  const ready = status === "authenticated" && !!token

  useEffect(() => {
    if (!ready) return
    let cancelled = false
    const load = async () => {
      try {
        setLoadingRestaurants(true)
        const res = await apiFetch<any>("/my-restaurants", { token })
        const list = extractList(res).map(normalizeRestaurant).filter((r) => Boolean(r.id))
        if (!cancelled) {
          setRestaurants(list)
          setSelectedId((current) => current || list[0]?.id || "")
        }
      } catch (err: any) {
        toast({ title: "Could not load restaurants", description: err?.message, variant: "destructive" })
      } finally {
        if (!cancelled) setLoadingRestaurants(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [ready, token, toast])

  useEffect(() => {
    if (!ready || !selectedId) return
    let cancelled = false
    const load = async () => {
      try {
        setLoadingEvents(true)
        const res = await apiFetch<any>(`/my-restaurants/${selectedId}/events`, { token })
        const list = extractList(res).map(normalizeEvent)
        if (!cancelled) setEvents(list)
      } catch (err: any) {
        toast({ title: "Could not load events", description: err?.message, variant: "destructive" })
      } finally {
        if (!cancelled) setLoadingEvents(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [ready, token, selectedId, toast])

  const openCreate = () => {
    setEditing({ timezone: "Africa/Addis_Ababa", is_active: true })
    setIsDialogOpen(true)
  }

  const openEdit = (ev: EventItem) => {
    setEditing({
      ...normalizeEvent(ev),
      imagePreview: ev.image_url || ev.image_urls?.[0] || null,
    })
    setIsDialogOpen(true)
  }

  const refreshEvents = async (restaurantId: string) => {
    const res = await apiFetch<any>(`/my-restaurants/${restaurantId}/events`, { token })
    const list = extractList(res).map(normalizeEvent)
    setEvents(list)
  }

  const uploadEventImage = async (restaurantId: string, file: File) => {
    const uploadFormData = new FormData()
    uploadFormData.append("file", file)
    uploadFormData.append("key_prefix", `events/${restaurantId}`)

    const uploadRes = await apiFetchWithProgress<any>("/media/upload", {
      method: "POST",
      token,
      body: uploadFormData,
      onProgress: (pct) => setUploadProgress(pct),
    })

    const url = getMediaUrl(uploadRes)
    if (!url) {
      throw new Error("Image upload succeeded but no URL was returned.")
    }

    return url
  }

  const handleSave = async (payload: EventDraft) => {
    if (!selectedId) return toast({ title: "No restaurant selected", variant: "destructive" })
    try {
      const imageFile = payload.imageFile || null
      if (imageFile && getOversizedFiles([imageFile]).length > 0) {
        toast({
          title: "Upload too large",
          description: "Each upload must be 5MB or less.",
          variant: "destructive",
        })
        return
      }

      setSaving(true)
      setUploadProgress(0)

      const imageUrl = imageFile ? await uploadEventImage(selectedId, imageFile) : payload.image_url || ""

      const normalizedDate = payload.start_date || payload.date || ""
      const normalizedEndDate = payload.end_date || normalizedDate
      const normalizedStartTime = payload.start_time || payload.time || ""
      const normalizedEndTime = payload.end_time || normalizedStartTime

      const requestBody: Record<string, any> = {
        title: String(payload.title || payload.name || "").trim(),
        description: String(payload.description || "").trim(),
        start_date: normalizedDate,
        end_date: normalizedEndDate,
        start_time: normalizedStartTime,
        end_time: normalizedEndTime,
        timezone: String(payload.timezone || "Africa/Addis_Ababa"),
        location: String(payload.location || "").trim(),
        href: String(payload.href || "").trim(),
        is_active: Boolean(payload.is_active ?? true),
      }

      if (imageUrl) {
        requestBody.image_url = imageUrl
        requestBody.image_urls = [imageUrl]
      }

      const method = payload.id ? "PATCH" : "POST"
      const path = payload.id ? `/my-restaurants/${selectedId}/events/${payload.id}` : `/my-restaurants/${selectedId}/events`
      await apiFetch(path, { method, token, body: requestBody })
      await refreshEvents(selectedId)
      toast({ title: payload.id ? "Event updated" : "Event created" })
      setIsDialogOpen(false)
      setEditing(null)
    } catch (err: any) {
      toast({ title: "Save failed", description: err?.message || "Could not save event", variant: "destructive" })
    } finally {
      setSaving(false)
      setUploadProgress(0)
    }
  }

  const handleDelete = async (ev: EventItem) => {
    if (!ev.id || !selectedId) return
    if (!confirm(`Delete event “${ev.title}”? This cannot be undone.`)) return
    try {
      await apiFetch(`/my-restaurants/${selectedId}/events/${ev.id}`, { method: "DELETE", token })
      toast({ title: "Event deleted" })
      setEvents((prev) => prev.filter((p) => String(p.id) !== String(ev.id)))
    } catch (err: any) {
      toast({ title: "Delete failed", description: err?.message || "Could not delete event", variant: "destructive" })
    }
  }

  return (
    <div className="dashboard-surface-polish max-w-7xl mx-auto pb-20 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black">Events</h1>
          <p className="text-sm text-muted-foreground">Manage upcoming events for your restaurants.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="rounded-xl border bg-background px-4 py-2"
            disabled={loadingRestaurants || restaurants.length === 0}
          >
            {restaurants.length === 0 && <option value="">No restaurants found</option>}
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <Button onClick={openCreate} className="inline-flex items-center gap-2" disabled={!selectedId || loadingRestaurants || saving}>
            <Plus className="h-4 w-4" /> New Event
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[60vh] overflow-y-auto">
        {loadingRestaurants || loadingEvents ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <LoadingSignal />
          </div>
        ) : events.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">No events yet.</div>
        ) : (
          events.map((ev) => (
            <Card key={String(ev.id)} className="overflow-hidden">
              <div className="relative aspect-video w-full overflow-hidden bg-muted">
                {getImageUrl(ev.image_url || ev.image_urls) ? (
                  <Image
                    src={getImageUrl(ev.image_url || ev.image_urls) || ""}
                    alt={ev.title || ev.name || "Event image"}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                    priority={events[0]?.id === ev.id}
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                    <ImageIcon className="h-6 w-6" />
                    <span className="text-[10px] font-black uppercase tracking-widest">No image</span>
                  </div>
                )}
              </div>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="font-semibold">{ev.title || ev.name || "Untitled event"}</span>
                  <span className="text-sm text-muted-foreground">{ev.start_date || ev.date || ""}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{ev.description}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(ev)} className="inline-flex items-center gap-2"><Edit2 className="h-4 w-4"/> Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(ev)} className="inline-flex items-center gap-2"><Trash2 className="h-4 w-4"/> Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && (setIsDialogOpen(false), setEditing(null))}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit Event" : "Create Event"}</DialogTitle>
          </DialogHeader>
          <EventForm
            initialValue={editing}
            onCancel={() => {
              setIsDialogOpen(false)
              setEditing(null)
            }}
            onSave={handleSave}
            saving={saving}
            uploadProgress={uploadProgress}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function EventForm({
  initialValue,
  onCancel,
  onSave,
  saving,
  uploadProgress,
}: {
  initialValue?: EventDraft | null
  onCancel: () => void
  onSave: (data: EventDraft) => Promise<void> | void
  saving: boolean
  uploadProgress: number
}) {
  const [form, setForm] = useState<EventDraft>(initialValue || { timezone: "Africa/Addis_Ababa", is_active: true })
  const [imagePreview, setImagePreview] = useState<string | null>(initialValue?.imagePreview || initialValue?.image_url || null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const nextForm = initialValue || { timezone: "Africa/Addis_Ababa", is_active: true }
    setForm(nextForm)
    setImagePreview(nextForm.imagePreview || nextForm.image_url || null)
    setImageFile(null)
  }, [initialValue])

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    const oversized = getOversizedFiles([file])
    if (oversized.length > 0) {
      toast({
        title: "Upload too large",
        description: "Each upload must be 5MB or less.",
        variant: "destructive",
      })
      return
    }

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setForm((current) => ({ ...current, imageFile: file }))
  }

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-black uppercase text-muted-foreground">Title</label>
          <Input value={form.title || ""} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} disabled={saving} />
        </div>
        <div>
          <label className="text-sm font-black uppercase text-muted-foreground">Image</label>
          <div className="mt-1 flex items-center gap-3 rounded-xl border border-dashed border-border p-3">
            <div className="h-16 w-24 overflow-hidden rounded-lg bg-muted">
              {imagePreview ? (
                <Image src={getImageUrl(imagePreview) || ""} alt="Event preview" fill sizes="96px" className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-5 w-5" />
                </div>
              )}
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:bg-muted">
              <Upload className="h-4 w-4" /> Upload image
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} disabled={saving} />
            </label>
          </div>
        </div>
      </div>

      {(imageFile || initialValue?.image_url) && (
        <p className="text-xs text-muted-foreground">{imageFile ? imageFile.name : "Using existing image"}</p>
      )}

      {saving && uploadProgress > 0 && uploadProgress < 100 && (
        <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-3">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-muted-foreground">
            <span>Uploading image and saving event</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} />
        </div>
      )}

      <div>
        <label className="text-sm font-black uppercase text-muted-foreground">Description</label>
        <Textarea value={form.description || ""} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} disabled={saving} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-black uppercase text-muted-foreground">Start date</label>
          <Input type="date" value={form.start_date || form.date || ""} onChange={(e) => setForm((s) => ({ ...s, start_date: e.target.value, date: e.target.value }))} disabled={saving} />
        </div>
        <div>
          <label className="text-sm font-black uppercase text-muted-foreground">End date</label>
          <Input type="date" value={form.end_date || form.start_date || form.date || ""} onChange={(e) => setForm((s) => ({ ...s, end_date: e.target.value }))} disabled={saving} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-black uppercase text-muted-foreground">Start time</label>
          <Input type="time" value={form.start_time || form.time || ""} onChange={(e) => setForm((s) => ({ ...s, start_time: e.target.value, time: e.target.value }))} disabled={saving} />
        </div>
        <div>
          <label className="text-sm font-black uppercase text-muted-foreground">End time</label>
          <Input type="time" value={form.end_time || ""} onChange={(e) => setForm((s) => ({ ...s, end_time: e.target.value }))} disabled={saving} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-black uppercase text-muted-foreground">Location</label>
          <Input value={form.location || ""} onChange={(e) => setForm((s) => ({ ...s, location: e.target.value }))} disabled={saving} />
        </div>
        <div>
          <label className="text-sm font-black uppercase text-muted-foreground">Timezone</label>
          <Input value={form.timezone || "Africa/Addis_Ababa"} onChange={(e) => setForm((s) => ({ ...s, timezone: e.target.value }))} disabled={saving} />
        </div>
      </div>

      <div>
        <label className="text-sm font-black uppercase text-muted-foreground">External URL</label>
        <Input value={form.href || ""} onChange={(e) => setForm((s) => ({ ...s, href: e.target.value }))} disabled={saving} />
      </div>
      <div>
        <label className="text-sm font-black uppercase text-muted-foreground">Price</label>
        <Input value={form.price || ""} onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))} disabled={saving} />
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
        <div>
          <p className="text-sm font-black uppercase tracking-widest text-foreground">Publish now</p>
          <p className="text-xs text-muted-foreground">Turn off if you want to save it as a draft.</p>
        </div>
        <label className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
          <input
            type="checkbox"
            checked={Boolean(form.is_active ?? true)}
            onChange={(e) => setForm((s) => ({ ...s, is_active: e.target.checked }))}
            disabled={saving}
          />
          Active
        </label>
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button
          onClick={() => onSave({ ...form, imageFile, imagePreview })}
          disabled={saving}
          className="inline-flex items-center gap-2"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? "Saving..." : initialValue?.id ? "Save" : "Create"}
        </Button>
      </div>
    </div>
  )
}
