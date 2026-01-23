"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { QrCode, Utensils, ListTree, Eye, EyeOff, TrendingUp, MapPin, Plus, ArrowUpRight, Loader2, Pencil, Trash } from "lucide-react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
import { useToast } from "@/components/ui/use-toast"
import { apiFetch } from "@/lib/api-client"
import Link from "next/link"

type Restaurant = {
  id: string
  name: string
  slug?: string
  description?: string
  city?: string
  country?: string
  is_published?: boolean
  phone?: string
  email?: string
  address?: string
  cuisine_type?: string
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const token = (session?.user as any)?.accessToken as string | undefined
  const { toast } = useToast()

  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedId, setSelectedId] = useState<string>("")
  const [addOpen, setAddOpen] = useState(false)
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
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({})
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [activeId, setActiveId] = useState<string>("")
  const [subscription, setSubscription] = useState<any>(null)

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")

  const selected = useMemo(
    () => restaurants.find((r) => r.id === selectedId) || restaurants[0],
    [restaurants, selectedId],
  )

  const totalCategories = restaurants.reduce((acc, r) => acc + (categoryCounts[r.id] ?? 0), 0)

  useEffect(() => {
    if (!token) return
    const load = async () => {
      try {
        const res = await apiFetch<any>("/my-restaurants", { token })
        const list: Restaurant[] = Array.isArray(res) ? res : (res?.data ?? [])
        setRestaurants(list)
        if (list.length && !selectedId) setSelectedId(list[0].id)
        
        // Subscription check
        try {
          const subRes = await apiFetch<any>("/subscription/me", { token })
          setSubscription(subRes?.data || subRes)
        } catch {}
      } catch (err: any) {
        toast({
          title: "Could not load restaurants",
          description: err?.message || "Please verify your account is active and try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token, selectedId, toast])

  useEffect(() => {
    if (!token) setLoading(false)
  }, [token])

  useEffect(() => {
    if (!token || !restaurants.length) {
      setCategoryCounts({})
      return
    }
    const load = async () => {
      try {
        const entries = await Promise.all(
          restaurants.map(async (r) => {
            try {
              const res = await apiFetch<any>(`/my-restaurants/${r.id}/categories`, { token })
              const arr: any[] = Array.isArray(res) ? res : (res?.data ?? [])
              return [r.id, arr.length || 0] as const
            } catch {
              return [r.id, 0] as const
            }
          }),
        )
        setCategoryCounts(Object.fromEntries(entries))
      } catch {
        /* ignore */
      }
    }
    load()
  }, [token, restaurants])

  const stats = [
    {
      title: "Restaurants",
      value: restaurants.length,
      icon: ListTree,
      description: "Owned by you",
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Published",
      value: restaurants.filter((r) => r.is_published).length,
      icon: Eye,
      description: "Live menus",
      color: "bg-green-50 text-green-600",
    },
    {
      title: "Draft",
      value: restaurants.filter((r) => !r.is_published).length,
      icon: Utensils,
      description: "Work in progress",
      color: "bg-teal-50 text-teal-600",
    },
    {
      title: "Categories",
      value: totalCategories,
      icon: ListTree,
      description: "Across restaurants",
      color: "bg-primary/5 text-primary",
    },
  ]

  const handleAdd = async () => {
    if (!token) {
      toast({ title: "Sign in required", description: "Please login again to add a restaurant.", variant: "destructive" })
      return
    }
    if (!draft.name.trim()) return
    const slug = slugify(draft.slug || draft.name)
    const formData = new FormData()
    formData.append("name", draft.name.trim())
    formData.append("slug", slug)
    if (draft.description) formData.append("description", draft.description.trim())
    if (draft.city) formData.append("city", draft.city.trim())
    if (draft.country) formData.append("country", draft.country.trim())
    if (draft.phone) formData.append("phone", draft.phone.trim())
    if (draft.email) formData.append("email", draft.email.trim())
    if (draft.address) formData.append("address", draft.address.trim())
    if (draft.cuisine_type) formData.append("cuisine_type", draft.cuisine_type.trim())
    formData.append("is_published", draft.is_published ? "true" : "false")

    try {
      setCreating(true)
      
      const res = await apiFetch<any>("/my-restaurants", {
        method: "POST",
        token,
        body: formData,
      })
      const created = Array.isArray(res) ? res[0] : (res?.data ?? res)
      if (created) {
        setRestaurants((prev) => [...prev, created])
        setSelectedId(created.id)
      }
      setDraft({ name: "", slug: "", description: "", city: "", country: "", phone: "", email: "", address: "", cuisine_type: "", is_published: false })
      setAddOpen(false)
      toast({ title: "Restaurant created", description: `${created?.name ?? ""} is ready to configure.` })
    } catch (err: any) {
      toast({ title: "Could not create restaurant", description: err?.message || "Please check required fields.", variant: "destructive" })
    } finally {
      setCreating(false)
    }
  }

  const openEdit = (restaurant: Restaurant) => {
    setActiveId(restaurant.id)
    setDraft({
      name: restaurant.name || "",
      slug: restaurant.slug || "",
      description: restaurant.description || "",
      city: restaurant.city || "",
      country: restaurant.country || "",
      phone: restaurant.phone || "",
      email: restaurant.email || "",
      address: restaurant.address || "",
      cuisine_type: restaurant.cuisine_type || "",
      is_published: !!restaurant.is_published,
    })
    setEditOpen(true)
  }

  const handleUpdate = async () => {
    if (!token) {
      toast({ title: "Sign in required", description: "Please login again to update this restaurant.", variant: "destructive" })
      return
    }
    if (!activeId || !draft.name.trim()) return
    try {
      setCreating(true)
      const formData = new FormData()
      formData.append("name", draft.name.trim())
      formData.append("slug", slugify(draft.slug || draft.name))
      formData.append("description", draft.description.trim())
      formData.append("city", draft.city.trim())
      formData.append("country", draft.country.trim())
      formData.append("phone", draft.phone.trim())
      formData.append("email", draft.email.trim())
      formData.append("address", draft.address.trim())
      formData.append("cuisine_type", draft.cuisine_type.trim())
      formData.append("is_published", draft.is_published ? "true" : "false")

      const res = await apiFetch<{ data: Restaurant }>(`/my-restaurants/${activeId}`, {
        method: "PATCH",
        token,
        body: formData,
      })
      const updated = res?.data || (res as any)
      if (updated) {
        setRestaurants((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)))
      }
      toast({ title: "Restaurant updated" })
      setEditOpen(false)
    } catch (err: any) {
      toast({ title: "Could not update restaurant", description: err?.message, variant: "destructive" })
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async () => {
    if (!token) {
      toast({ title: "Sign in required", description: "Please login again to delete this restaurant.", variant: "destructive" })
      return
    }
    if (!activeId) return
    try {
      setCreating(true)
      await apiFetch(`/my-restaurants/${activeId}`, {
        method: "DELETE",
        token,
      })
      setRestaurants((prev) => prev.filter((r) => r.id !== activeId))
      if (selectedId === activeId) {
        const next = restaurants.find((r) => r.id !== activeId)
        setSelectedId(next?.id || "")
      }
      toast({ title: "Restaurant deleted" })
    } catch (err: any) {
      toast({ title: "Could not delete restaurant", description: err?.message, variant: "destructive" })
    } finally {
      setCreating(false)
      setDeleteOpen(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Plan Usage Banner */}
      {subscription && (
        <div className="bg-primary/5 border border-primary/20 rounded-3xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-primary/60">Restaurants</p>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">
                    {restaurants.length} / {subscription.features?.max_restaurants === -1 ? '∞' : subscription.features?.max_restaurants}
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden sm:block h-8 w-px bg-primary/10" />

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center text-primary">
                <Utensils className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-primary/60">Staff Slots</p>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">
                    Limit: {subscription.features?.max_staff_accounts === -1 ? '∞' : subscription.features?.max_staff_accounts}
                  </span>
                </div>
              </div>
            </div>
            
            <Badge variant="outline" className="text-[10px] uppercase border-primary/20 text-primary self-center">
              {subscription.plan_name} Plan
            </Badge>
          </div>
          
          <div className="flex-1 max-w-xs w-full flex flex-col gap-1.5">
             <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">
                <span>Network Capacity</span>
                <span>{subscription.features?.max_restaurants === -1 ? '100' : Math.round((restaurants.length / subscription.features?.max_restaurants) * 100)}%</span>
             </div>
             <div className="h-2 w-full bg-primary/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-1000" 
                  style={{ width: `${subscription.features?.max_restaurants === -1 ? 0 : Math.min(100, (restaurants.length / subscription.features?.max_restaurants) * 100)}%` }}
                />
             </div>
          </div>

          <Button variant="ghost" className="rounded-xl text-primary font-bold hover:bg-primary/10" asChild>
            <Link href="/dashboard/settings">Manage Plan</Link>
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your dashboard...
        </div>
      )}

      <div className="relative overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-r from-primary/5 via-white to-secondary/20 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Dashboard</p>
            <h1 className="text-3xl sm:text-4xl font-serif text-foreground tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground text-base">Manage multiple restaurants, menus, and QR experiences.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="default" className="gap-2">
              <Link href="/dashboard/menu">
                <Utensils className="h-4 w-4" /> Manage menus
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/dashboard/categories">
                <ListTree className="h-4 w-4" /> Categories
              </Link>
            </Button>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <Plus className="h-4 w-4" /> Add restaurant
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add a restaurant</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label>Name</Label>
                    <Input
                      value={draft.name}
                      onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                      placeholder="Harborview Hotel"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Slug</Label>
                    <Input
                      value={draft.slug}
                      onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))}
                      placeholder="harborview"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Description</Label>
                    <Input
                      value={draft.description}
                      onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                      placeholder="Short summary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Phone</Label>
                      <Input
                        value={draft.phone}
                        onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={draft.email}
                        onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                        placeholder="info@your-restaurant.com"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>City</Label>
                      <Input
                        value={draft.city}
                        onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))}
                        placeholder="City"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Country</Label>
                      <Input
                        value={draft.country}
                        onChange={(e) => setDraft((d) => ({ ...d, country: e.target.value }))}
                        placeholder="Country"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Address</Label>
                      <Input
                        value={draft.address}
                        onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))}
                        placeholder="123 Main St"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Cuisine type</Label>
                      <Input
                        value={draft.cuisine_type}
                        onChange={(e) => setDraft((d) => ({ ...d, cuisine_type: e.target.value }))}
                        placeholder="Italian, Ethiopian, ..."
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border border-transparent hover:border-primary/10 transition-all">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-bold">Public Menu</Label>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Make this restaurant visible to customers</p>
                    </div>
                    <Switch
                      checked={draft.is_published}
                      onCheckedChange={(checked) => setDraft((d) => ({ ...d, is_published: checked }))}
                    />
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button variant="outline" onClick={() => setAddOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAdd} disabled={!draft.name.trim() || creating}>
                    {creating ? "Saving..." : "Save"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-primary/5 shadow-sm hover:shadow-md transition-all group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {stat.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${stat.color} transition-transform group-hover:scale-110`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stat.value}</div>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                <p className="text-xs text-emerald-600 font-medium">Live data</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selected && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-primary/10 bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Selected restaurant</CardTitle>
              <Badge variant={selected.is_published ? "secondary" : "outline"}>
                {selected.is_published ? "Live" : "Draft"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-lg font-semibold text-foreground">{selected.name}</div>
              <p className="text-sm text-muted-foreground">{selected.city || "City"}, {selected.country || "Country"}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ListTree className="h-4 w-4 text-primary" /> {categoryCounts[selected.id] ?? "—"} categories
              </div>
            </CardContent>
          </Card>
          <Card className="border-primary/10 bg-white shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-sm font-semibold">Manage menus</CardTitle>
              <CardDescription>Update menu items, prices, and availability.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full justify-between">
                <Link href="/dashboard/menu">
                  Go to menus
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="border-primary/10 bg-white shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-sm font-semibold">QR & sharing</CardTitle>
              <CardDescription>Download or share QR for this venue.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full justify-between">
                <Link href="/dashboard/qr">
                  Manage QR
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Your restaurants</h2>
          <p className="text-sm text-muted-foreground">Manage venues under your account.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {restaurants.length > 0 ? (
            restaurants.map((restaurant) => (
              <Card key={restaurant.id} className="border-primary/5 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <div>
                    <CardTitle className="text-lg font-semibold">{restaurant.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 text-xs">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      {restaurant.city || "City"}, {restaurant.country || "Country"}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={restaurant.is_published ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                      {restaurant.is_published ? "Live" : "Draft"}
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Toggle visibility"
                      className={restaurant.is_published ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" : "text-amber-600 hover:text-amber-700 hover:bg-amber-50"}
                      onClick={async () => {
                        try {
                          const nextStatus = !restaurant.is_published;
                          const formData = new FormData()
                          formData.append("is_published", nextStatus ? "true" : "false")
                          
                          await apiFetch(`/my-restaurants/${restaurant.id}`, {
                            method: "PATCH",
                            token,
                            body: formData,
                          });
                          setRestaurants(prev => prev.map(r => r.id === restaurant.id ? { ...r, is_published: nextStatus } : r));
                          toast({ title: nextStatus ? "Menu Published" : "Menu set to Draft", description: `${restaurant.name} is now ${nextStatus ? 'visible' : 'hidden'} to the public.` });
                        } catch (err: any) {
                          toast({ title: "Failed to update status", description: err.message, variant: "destructive" });
                        }
                      }}
                    >
                      {restaurant.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Edit restaurant"
                      onClick={() => openEdit(restaurant)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Delete restaurant"
                      onClick={() => {
                        setActiveId(restaurant.id)
                        setDeleteOpen(true)
                      }}
                    >
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Slug</span>
                    <span className="font-semibold text-foreground">{restaurant.slug || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Categories</span>
                    <span className="font-semibold text-foreground">{categoryCounts[restaurant.id] ?? "—"}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Status</span>
                    <span className="font-semibold text-foreground">{restaurant.is_published ? "Published" : "Unpublished"}</span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button asChild size="sm" variant="outline" className="gap-1">
                      <Link href="/dashboard/categories">
                        <ListTree className="h-4 w-4" /> Categories
                      </Link>
                    </Button>
                    <Button asChild size="sm" className="gap-1">
                      <Link href="/dashboard/menu">
                        <Utensils className="h-4 w-4" /> Items
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="ghost" className="gap-1">
                      <Link href="/dashboard/qr">
                        <QrCode className="h-4 w-4" /> QR
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Button 
              variant="outline" 
              className="col-span-full h-40 rounded-[2rem] border-dashed border-2 flex flex-col gap-3 bg-primary/5 hover:bg-primary/10 transition-all border-primary/20"
              onClick={() => setAddOpen(true)}
            >
              <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                 <Plus className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="font-black uppercase tracking-widest text-xs text-primary">No Restaurants Found</p>
                <p className="text-[10px] text-muted-foreground font-medium">Click here to launch your first digital venue</p>
              </div>
            </Button>
          )}
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit restaurant</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                placeholder="Harborview Hotel"
              />
            </div>
            <div className="space-y-1">
              <Label>Slug</Label>
              <Input
                value={draft.slug}
                onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))}
                placeholder="harborview"
              />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                placeholder="Short summary"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Phone</Label>
                <Input
                  value={draft.phone}
                  onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={draft.email}
                  onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                  placeholder="info@your-restaurant.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>City</Label>
                <Input
                  value={draft.city}
                  onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))}
                  placeholder="City"
                />
              </div>
              <div className="space-y-1">
                <Label>Country</Label>
                <Input
                  value={draft.country}
                  onChange={(e) => setDraft((d) => ({ ...d, country: e.target.value }))}
                  placeholder="Country"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Address</Label>
                <Input
                  value={draft.address}
                  onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))}
                  placeholder="123 Main St"
                />
              </div>
              <div className="space-y-1">
                <Label>Cuisine type</Label>
                <Input
                  value={draft.cuisine_type}
                  onChange={(e) => setDraft((d) => ({ ...d, cuisine_type: e.target.value }))}
                  placeholder="Italian, Ethiopian, ..."
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border border-transparent hover:border-primary/10 transition-all">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold">Public Status</Label>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Visibility on the public discovery platform</p>
              </div>
              <Switch
                checked={draft.is_published}
                onCheckedChange={(checked) => setDraft((d) => ({ ...d, is_published: checked }))}
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={!draft.name.trim() || creating}>
              {creating ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this restaurant?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the restaurant and its menus. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
