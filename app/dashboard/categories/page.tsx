"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { 
  Plus, 
  LayoutGrid, 
  Search, 
  ChevronRight,
  Hotel,
  MoreVertical,
  Pencil,
  Trash,
  ArrowUpRight,
  Sparkles,
  Info,
  ListFilter,
  Layers,
  Clock,
  ChevronDown
} from "lucide-react"
import Link from "next/link"
import { LoadingSignal } from "@/components/ui/loading-signal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { useToast } from "@/components/ui/use-toast"
import { apiFetch } from "@/lib/api-client"

type Restaurant = { id: string; name: string }
type Category = { id: string; name: string; description?: string; itemCount?: number; display_order?: number }

export default function CategoriesPage() {
  const { data: session } = useSession()
  const token = (session?.user as any)?.accessToken as string | undefined
  const { toast } = useToast()

  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [restaurantId, setRestaurantId] = useState<string>("")
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<Category | null>(null)
  const [newName, setNewName] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [subscription, setSubscription] = useState<any>(null)

  const filteredCategories = useMemo(() => {
    return categories.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [categories, searchQuery])

  const selectedRestaurant = useMemo(
    () => restaurants.find((r) => r.id === restaurantId) || restaurants[0],
    [restaurants, restaurantId],
  )

  useEffect(() => {
    if (!token) return
    const load = async () => {
      try {
        setLoading(true)
        const res = await apiFetch<any>("/my-restaurants", { token })
        const list = Array.isArray(res) ? res : (res?.data || [])
        setRestaurants(list)
        if (list.length && !restaurantId) {
          setRestaurantId(list[0].id)
        }

        // Load Subscription
        try {
          const subRes = await apiFetch<any>("/subscription/me", { token })
          setSubscription(subRes?.data || subRes)
        } catch {}
      } catch (err: any) {
        toast({ title: "Could not load restaurants", description: err?.message, variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [token, restaurantId, toast])

  useEffect(() => {
    if (!token || !restaurantId) return

    const loadCategories = async () => {
      try {
        setLoading(true)
        const res = await apiFetch<any>(`/my-restaurants/${restaurantId}/categories`, { token })
        setCategories(Array.isArray(res) ? res : (res?.data || []))
      } catch (err: any) {
        toast({ title: "Could not load categories", description: err?.message, variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }

    loadCategories()
  }, [token, restaurantId, toast])

  const handleAdd = async () => {
    if (!token) {
      toast({ title: "Sign in required", variant: "destructive" })
      return
    }
    if (!newName.trim() || !restaurantId) return
    try {
      setSaving(true)
      await apiFetch(`/my-restaurants/${restaurantId}/categories`, {
        method: "POST",
        token,
        body: {
          name: newName.trim(),
          description: newDescription.trim() || undefined,
          display_order: categories.length + 1,
          is_active: true,
        },
      })
      toast({ title: "Category created" })
      setNewName("")
      setNewDescription("")
      setAddOpen(false)
      // refresh list
      const res = await apiFetch<any>(`/my-restaurants/${restaurantId}/categories`, { token })
      setCategories(Array.isArray(res) ? res : (res?.data || []))
    } catch (err: any) {
      toast({ title: "Could not create category", description: err?.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async () => {
    if (!token) {
      toast({ title: "Sign in required", variant: "destructive" })
      return
    }
    if (!newName.trim() || !restaurantId || !activeCategory) return
    try {
      setSaving(true)
      await apiFetch(`/my-restaurants/${restaurantId}/categories/${activeCategory.id}`, {
        method: "PATCH",
        token,
        body: {
          name: newName.trim(),
          description: newDescription.trim() || undefined,
        },
      })
      toast({ title: "Category updated" })
      setEditOpen(false)
      const res = await apiFetch<any>(`/my-restaurants/${restaurantId}/categories`, { token })
      setCategories(Array.isArray(res) ? res : (res?.data || []))
    } catch (err: any) {
      toast({ title: "Could not update category", description: err?.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!token) {
      toast({ title: "Sign in required", variant: "destructive" })
      return
    }
    if (!restaurantId || !activeCategory) return
    try {
      setSaving(true)
      await apiFetch(`/my-restaurants/${restaurantId}/categories/${activeCategory.id}`, {
        method: "DELETE",
        token,
      })
      toast({ title: "Category deleted" })
      setDeleteOpen(false)
      const res = await apiFetch<any>(`/my-restaurants/${restaurantId}/categories`, { token })
      setCategories(Array.isArray(res) ? res : (res?.data || []))
    } catch (err: any) {
      toast({ title: "Could not delete category", description: err?.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const itemCountFallback = (c: Category) => c.itemCount ?? 0

  return (
    <div className="max-w-7xl mx-auto space-y-8 md:space-y-12 pb-12 md:pb-24 px-4 md:px-0">
      {/* 1. CAPACITY BANNER */}
      {subscription && (
        <div className="bg-card/40 backdrop-blur-3xl border-2 border-border/50 rounded-[2.5rem] md:rounded-[3.5rem] p-6 md:p-10 flex flex-col lg:flex-row items-center justify-between gap-8 md:gap-12 shadow-3xl group hover:border-primary/20 transition-all duration-700">
          <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-8 text-center sm:text-left">
            <div className="h-16 w-16 md:h-24 md:w-24 rounded-2xl md:rounded-[2rem] bg-gradient-to-br from-primary/20 to-transparent flex items-center justify-center border-2 border-primary/20 shadow-inner group-hover:scale-105 transition-transform duration-500 shrink-0">
               <Layers className="h-8 w-8 md:h-10 md:w-10 text-primary drop-shadow-[0_0_15px_rgba(230,57,70,0.4)]" />
            </div>
            <div>
              <Badge className="bg-primary/10 text-primary border border-primary/20 font-black text-[10px] uppercase tracking-[0.4em] px-4 py-1.5 rounded-full mb-3 mx-auto sm:mx-0 w-fit">
                Category Limits
              </Badge>
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 md:gap-4">
                <h2 className="text-3xl md:text-5xl font-black text-foreground tracking-tighter uppercase leading-none">
                  {categories.length} <span className="text-muted-foreground italic font-serif lowercase tracking-normal">categories</span>
                </h2>
                <span className="text-muted-foreground font-black uppercase text-[10px] tracking-widest">
                  of {subscription.features?.max_categories === -1 ? '∞' : subscription.features?.max_categories} used
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 max-w-md w-full space-y-3 md:space-y-4">
             <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground">
                <span>Capacity used</span>
                <span className="text-primary">{subscription.features?.max_categories === -1 ? '0' : Math.round((categories.length / subscription.features?.max_categories) * 100)}%</span>
             </div>
             <div className="h-4 w-full bg-muted rounded-full overflow-hidden border-2 border-border/50 pr-1 py-1 pl-1">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-orange-500 rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(230,57,70,0.6)]" 
                  style={{ width: `${subscription.features?.max_categories === -1 ? 0 : Math.min(100, (categories.length / subscription.features?.max_categories) * 100)}%` }}
                />
             </div>
          </div>

          <Button variant="ghost" className="h-14 md:h-20 px-8 md:px-10 rounded-2xl md:rounded-[2rem] w-full lg:w-auto bg-muted/30 border border-border/50 font-black uppercase text-[10px] md:text-xs tracking-[0.3em] text-muted-foreground hover:bg-primary hover:text-white transition-all group/btn" asChild>
            <Link href="/dashboard/settings" className="flex items-center gap-4 justify-center">
               Upgrade Plan <ArrowUpRight className="h-5 w-5 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-all" />
            </Link>
          </Button>
        </div>
      )}

      {/* 2. HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 md:gap-10">
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center gap-4">
             <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
             <span className="text-[11px] font-black uppercase tracking-[0.5em] text-muted-foreground">Category Management</span>
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-foreground tracking-tighter uppercase leading-[0.9]">
            Menu <span className="text-muted-foreground italic font-serif lowercase tracking-normal">categories</span>
          </h1>
          <p className="text-muted-foreground font-medium max-w-lg text-base md:text-lg italic serif leading-relaxed">
            "Organize your menu by creating categories to group your items for customers."
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 md:gap-6">
          <div className="flex flex-col gap-2 md:gap-3">
            <span className="text-[10px] uppercase font-black tracking-[0.4em] text-muted-foreground ml-1 text-center md:text-left">Currently customizing</span>
            <div className="relative group">
              <Hotel className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
              <select
                className="h-16 md:h-20 w-full sm:w-64 md:w-80 rounded-2xl md:rounded-[2rem] border-2 border-border/60 bg-card/40 pl-16 pr-8 text-xs md:text-sm font-black tracking-widest uppercase focus:border-primary/50 focus:outline-none transition-all appearance-none cursor-pointer shadow-3xl text-foreground"
                value={restaurantId}
                onChange={(e) => setRestaurantId(e.target.value)}
                disabled={!restaurants.length}
              >
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id} className="bg-card text-foreground font-black">
                    {r.name.toUpperCase()}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-primary pointer-events-none group-hover:scale-110 transition-transform" />
            </div>
          </div>

          <Button 
            className="h-16 md:h-20 px-8 md:px-12 rounded-2xl md:rounded-[2rem] bg-primary text-white font-black uppercase text-xs tracking-[0.3em] overflow-hidden group shadow-[0_25px_50px_-12px_rgba(230,57,70,0.5)] hover:scale-105 transition-all w-full sm:w-auto" 
            disabled={!restaurantId}
            onClick={() => {
              setNewName("")
              setNewDescription("")
              setAddOpen(true)
            }}
          >
            <Plus className="h-5 md:h-6 w-5 md:w-6 mr-3 md:mr-4" /> Add Category
          </Button>
        </div>
      </div>

      {/* 3. SEARCH & ANALYTICS BAR */}
      <div className="bg-card/40 backdrop-blur-3xl border border-border/60 p-3 md:p-4 rounded-3xl md:rounded-[2.5rem] flex flex-col md:flex-row items-center gap-4 md:gap-8 shadow-2xl">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="SEARCH CATEGORIES..." 
            className="pl-14 border-none bg-transparent h-12 md:h-16 text-lg md:text-xl font-black tracking-widest placeholder:text-muted-foreground/30 focus-visible:ring-0 text-foreground uppercase w-full" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="h-10 w-px bg-border/20 hidden md:block" />
        <div className="flex items-center justify-between w-full md:w-auto gap-6 px-4">
           <div className="flex flex-col items-start md:items-end">
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground">Total Categories</span>
              <span className="text-xl font-black text-foreground italic serif">{filteredCategories.length} Units</span>
           </div>
           <Button variant="ghost" size="icon" className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl hover:bg-muted/50 text-muted-foreground">
              <ListFilter className="h-5 w-5" />
           </Button>
        </div>
      </div>

      {/* 4. CATEGORIES GRID */}
      <div className="grid gap-6 md:gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-20 md:py-40 flex flex-col items-center justify-center gap-6 md:gap-8">
             <LoadingSignal />
             <p className="font-black uppercase tracking-[0.5em] text-[10px] md:text-[11px] text-muted-foreground animate-pulse">Loading categories...</p>
          </div>
        ) : filteredCategories.length > 0 ? (
          filteredCategories.map((category) => (
            <Card key={category.id} className="group relative bg-card/40 backdrop-blur-3xl border-2 border-border/60 rounded-[2.5rem] md:rounded-[4rem] p-6 md:p-12 overflow-hidden hover:border-primary/30 transition-all duration-700 hover:shadow-3xl">
              {/* Decorative nodes */}
              <div className="absolute top-6 right-6 md:top-8 md:right-8 flex gap-1">
                 {[...Array(3)].map((_, i) => <div key={i} className="h-1 w-1 rounded-full bg-border/20" />)}
              </div>
              
              <div className="flex items-start justify-between mb-8 md:mb-12">
                <div className="h-16 w-16 md:h-24 md:w-24 rounded-2xl md:rounded-[2.5rem] bg-muted/30 flex items-center justify-center border-2 border-border/60 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-500 group-hover:scale-110 shrink-0">
                  <Layers className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-muted border border-border/60 hover:bg-primary hover:text-white transition-all text-muted-foreground"
                    onClick={() => {
                      setActiveCategory(category)
                      setNewName(category.name)
                      setNewDescription(category.description || "")
                      setEditOpen(true)
                    }}
                  >
                    <Pencil className="h-4 md:h-5 w-4 md:w-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-muted border border-border/60 hover:bg-destructive hover:text-white transition-all text-muted-foreground"
                    onClick={() => {
                        setActiveCategory(category)
                        setDeleteOpen(true)
                    }}
                  >
                    <Trash className="h-4 md:h-5 w-4 md:w-5" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4 md:space-y-6 mb-8 md:mb-12">
                 <Badge className="bg-primary/10 text-primary border border-primary/20 font-black text-[9px] uppercase tracking-[0.4em] px-3 py-1 rounded-full">
                    ID: {category.id.slice(0, 6).toUpperCase()}
                 </Badge>
                <h3 className="text-2xl md:text-3xl lg:text-4xl font-black text-foreground hover:text-primary transition-colors line-clamp-1 uppercase tracking-tighter leading-none">
                  {category.name}
                </h3>
                <p className="text-muted-foreground text-sm md:text-base lg:text-lg font-medium italic serif line-clamp-2 h-10 md:h-14 border-l-2 border-primary/20 pl-4 md:pl-6 leading-relaxed">
                  {category.description || "No description provided for this category."}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pt-6 md:pt-10 border-t border-border/60">
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Attached Items</span>
                  <div className="flex items-baseline gap-2">
                     <span className="text-3xl md:text-4xl font-black text-foreground italic serif leading-none">{itemCountFallback(category)}</span>
                     <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">items</span>
                  </div>
                </div>
                
                <Button variant="ghost" className="h-12 md:h-14 px-6 md:px-8 rounded-xl md:rounded-2xl bg-muted/50 border border-border/60 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:bg-primary hover:text-white transition-all w-full sm:w-auto" asChild>
                   <Link href={`/dashboard/menu?category=${category.id}`}>
                      View Items <ArrowUpRight className="h-4 w-4 ml-3" />
                   </Link>
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-20 md:py-40 text-center bg-card/20 rounded-[2.5rem] md:rounded-[5rem] border-4 border-dashed border-border/60 group hover:border-primary/20 transition-all duration-700 p-6">
            <div className="h-20 w-20 md:h-32 md:w-32 rounded-2xl md:rounded-[3rem] bg-muted/30 flex items-center justify-center mx-auto mb-6 md:mb-10 border-2 border-border/60 group-hover:scale-110 transition-transform duration-500">
               <Layers className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground" />
            </div>
            <h3 className="text-3xl md:text-5xl font-black text-foreground uppercase tracking-tighter mb-4 md:mb-6 leading-none">No categories <span className="text-muted-foreground italic font-serif lowercase tracking-normal">yet.</span></h3>
            <p className="text-muted-foreground font-medium max-w-sm mx-auto mb-8 md:mb-12 text-lg md:text-xl italic serif leading-relaxed px-4">
              "Create your first category to start organizing your digital menu items."
            </p>
            <Button onClick={() => setAddOpen(true)} className="h-16 md:h-24 px-8 md:px-16 rounded-2xl md:rounded-[2.5rem] bg-primary text-white font-black uppercase text-xs md:text-sm tracking-[0.4em] hover:scale-105 transition-all shadow-3xl shadow-primary/30 w-full sm:w-auto">
               Add First Category
            </Button>
          </div>
        )}
      </div>

      {/* 5. CATEGORY DETAILS SIDE-PANEL (SHEET) */}
      <Sheet open={addOpen || editOpen} onOpenChange={(open) => { if(!open) { setAddOpen(false); setEditOpen(false); } }}>
        <SheetContent className="w-full sm:max-w-2xl bg-card border-l border-border/60 p-0 overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="p-6 md:p-12 space-y-6 md:space-y-8 bg-muted/20 border-b border-border/60">
              <div className="flex items-center gap-4">
                <div className="h-10 w-1 bg-primary rounded-full" />
                <Badge className="bg-primary/10 text-primary border border-primary/20 font-black text-[10px] uppercase tracking-[0.4em] px-4 py-2 rounded-full">
                  Category Details
                </Badge>
              </div>
              <div className="space-y-4">
                <SheetTitle className="text-4xl md:text-6xl font-black text-foreground tracking-tighter uppercase leading-none">
                  {editOpen ? "Edit" : "New"} <span className="text-muted-foreground italic font-serif lowercase tracking-normal">Category</span>
                </SheetTitle>
                <SheetDescription className="text-muted-foreground text-base md:text-lg font-medium italic serif leading-relaxed">
                   "Provide a name and description to organize your menu items."
                </SheetDescription>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-8 md:space-y-12">
               {/* Metadata Section */}
               <section className="space-y-8 md:space-y-10 md:px-2">
                  <div className="flex items-center gap-4">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground">Category Info</h4>
                  </div>

                  <div className="space-y-8 md:space-y-10">
                    <div className="space-y-3 md:space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-1">Category Name</Label>
                      <Input
                        className="h-14 md:h-20 rounded-xl md:rounded-[1.5rem] border-2 border-border/60 bg-muted/40 text-xl md:text-2xl font-black px-6 md:px-8 text-foreground placeholder:text-muted-foreground/30 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all uppercase tracking-tighter shadow-xl"
                        placeholder="E.G. MAIN COURSE"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-3 md:space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-1">Description</Label>
                      <textarea
                        className="w-full min-h-[150px] md:min-h-[200px] rounded-xl md:rounded-[1.5rem] border-2 border-border/60 bg-muted/40 p-6 md:p-8 font-medium text-base md:text-lg text-foreground focus:outline-none focus:border-primary/50 transition-all resize-none italic serif shadow-xl"
                        placeholder="Provide details about this category..."
                        value={newDescription}
                        onChange={e => setNewDescription(e.target.value)}
                      />
                    </div>
                  </div>
               </section>

               {/* Design Advice */}
               <div className="p-6 md:p-8 rounded-2xl md:rounded-[2rem] bg-muted/40 border border-border/50 flex gap-4 md:gap-6 items-start">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                     <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                  </div>
                  <div className="space-y-1 md:space-y-2">
                     <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Pro Tip</p>
                     <p className="text-xs md:text-sm text-muted-foreground font-medium italic serif leading-relaxed">
                        Clear category names and descriptions help customers navigate your menu more efficiently.
                     </p>
                  </div>
               </div>
            </div>

            <div className="p-6 md:p-12 bg-muted/20 border-t border-border/60 flex flex-col sm:flex-row gap-4 md:gap-6">
              <Button 
                variant="ghost" 
                className="h-14 md:h-20 flex-1 rounded-xl md:rounded-[1.5rem] font-black uppercase text-xs tracking-[0.3em] text-muted-foreground hover:bg-muted" 
                onClick={() => { setAddOpen(false); setEditOpen(false); }}
              >
                Cancel
              </Button>
              <Button 
                className="h-14 md:h-20 flex-[2] rounded-xl md:rounded-[1.5rem] bg-primary text-white font-black uppercase text-xs tracking-[0.3em] shadow-3xl shadow-primary/30 hover:scale-[1.02] transition-all"
                onClick={editOpen ? handleEdit : handleAdd}
                disabled={!newName.trim() || saving}
              >
                {saving ? (
                  <LoadingSignal size="sm" className="h-5 md:h-6 w-5 md:w-6" />
                ) : (
                  <>
                    {editOpen ? "Save Changes" : "Create Category"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[60]" />
        <AlertDialogContent className="bg-card border-2 border-border/60 rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-16 max-w-[95vw] sm:max-w-xl shadow-3xl z-[70]">
          <AlertDialogHeader className="mb-8 md:mb-12 text-center sm:text-left">
            <div className="h-20 w-20 md:h-24 md:w-24 bg-primary/10 rounded-2xl md:rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 md:mb-10 border-2 border-primary/20">
               <Trash className="h-10 w-10 md:h-12 md:w-12 text-primary drop-shadow-[0_0_15px_rgba(230,57,70,0.5)]" />
            </div>
            <AlertDialogTitle className="text-3xl md:text-5xl font-black text-foreground tracking-tighter text-center uppercase leading-none">
              Delete <span className="text-muted-foreground italic font-serif lowercase tracking-normal">Category?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-muted-foreground font-medium text-base md:text-lg leading-relaxed mt-4 md:mt-6 italic serif px-2 md:px-6">
              "This action will permanently delete this category and all associated menu items. This cannot be undone."
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
            <AlertDialogCancel className="h-14 md:h-20 flex-1 rounded-xl md:rounded-[1.5rem] border-2 border-border/60 bg-transparent text-muted-foreground font-black uppercase text-xs tracking-[0.3em] hover:bg-muted">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="h-14 md:h-20 flex-1 rounded-xl md:rounded-[1.5rem] bg-primary text-white font-black uppercase text-xs tracking-[0.3em] hover:bg-destructive shadow-3xl shadow-primary/30"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

