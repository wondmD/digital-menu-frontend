"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { 
  Plus, 
  Loader2, 
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
  Clock
} from "lucide-react"
import Link from "next/link"
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
    <div className="max-w-7xl mx-auto space-y-12 pb-24">
      {/* 1. CAPACITY TELEMETRY BANNER */}
      {subscription && (
        <div className="bg-card/40 backdrop-blur-3xl border-2 border-border/50 rounded-[3.5rem] p-10 flex flex-col lg:flex-row items-center justify-between gap-12 shadow-3xl group hover:border-primary/20 transition-all duration-700">
          <div className="flex items-center gap-8">
            <div className="h-24 w-24 rounded-[2rem] bg-gradient-to-br from-primary/20 to-transparent flex items-center justify-center border-2 border-primary/20 shadow-inner group-hover:scale-105 transition-transform duration-500">
               <Layers className="h-10 w-10 text-primary drop-shadow-[0_0_15px_rgba(230,57,70,0.4)]" />
            </div>
            <div>
              <Badge className="bg-primary/10 text-primary border border-primary/20 font-black text-[10px] uppercase tracking-[0.4em] px-4 py-1.5 rounded-full mb-3">
                Registry Capacity
              </Badge>
              <div className="flex items-baseline gap-4">
                <h2 className="text-5xl font-black text-foreground tracking-tighter uppercase leading-none">
                  {categories.length} <span className="text-muted-foreground italic font-serif lowercase tracking-normal">units</span>
                </h2>
                <span className="text-muted-foreground font-black uppercase text-[10px] tracking-widest">
                  of {subscription.features?.max_categories === -1 ? '∞' : subscription.features?.max_categories} allocated
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 max-w-md w-full space-y-4">
             <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground">
                <span>Infrastructure Load</span>
                <span className="text-primary">{subscription.features?.max_categories === -1 ? '0' : Math.round((categories.length / subscription.features?.max_categories) * 100)}%</span>
             </div>
             <div className="h-4 w-full bg-muted rounded-full overflow-hidden border-2 border-border/5 pr-1 py-1 pl-1">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-orange-500 rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(230,57,70,0.6)]" 
                  style={{ width: `${subscription.features?.max_categories === -1 ? 0 : Math.min(100, (categories.length / subscription.features?.max_categories) * 100)}%` }}
                />
             </div>
          </div>

          <Button variant="ghost" className="h-20 px-10 rounded-[2rem] bg-muted/30 border border-border/5 font-black uppercase text-xs tracking-[0.3em] text-muted-foreground hover:bg-primary hover:text-white transition-all group/btn" asChild>
            <Link href="/dashboard/settings" className="flex items-center gap-4">
               Expand Registry <ArrowUpRight className="h-5 w-5 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-all" />
            </Link>
          </Button>
        </div>
      )}

      {/* 2. OPERATIONAL CONTROL HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
             <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
             <span className="text-[11px] font-black uppercase tracking-[0.5em] text-muted-foreground">Taxonomy Protocol</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-foreground tracking-tighter uppercase leading-[0.9]">
            Menu <span className="text-muted-foreground italic font-serif lowercase tracking-normal">categories</span>
          </h1>
          <p className="text-muted-foreground font-medium max-w-lg text-lg italic serif leading-relaxed">
            "Define the taxonomic foundations of your culinary digital assets. Structure equals clarity."
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col gap-3">
            <span className="text-[10px] uppercase font-black tracking-[0.4em] text-muted-foreground ml-1">Registry Context</span>
            <div className="relative group">
              <Hotel className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
              <select
                className="h-20 w-80 rounded-[2rem] border-2 border-border/10 bg-card/40 pl-16 pr-8 text-sm font-black tracking-widest uppercase focus:border-primary/50 focus:outline-none transition-all appearance-none cursor-pointer shadow-3xl text-foreground"
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
            </div>
          </div>

          <Button 
            className="h-20 px-12 rounded-[2rem] bg-primary text-white font-black uppercase text-xs tracking-[0.3em] overflow-hidden group shadow-[0_25px_50px_-12px_rgba(230,57,70,0.5)] hover:scale-105 transition-all" 
            disabled={!restaurantId}
            onClick={() => {
              setNewName("")
              setNewDescription("")
              setAddOpen(true)
            }}
          >
            <Plus className="h-6 w-6 mr-4" /> Establish Unit
          </Button>
        </div>
      </div>

      {/* 3. SEARCH & ANALYTICS BAR */}
      <div className="bg-card/40 backdrop-blur-3xl border border-border/10 p-4 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 shadow-2xl">
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="FILTER TAXONOMY MANIFEST..." 
            className="pl-16 border-none bg-transparent h-16 text-xl font-black tracking-widest placeholder:text-muted-foreground/30 focus-visible:ring-0 text-foreground uppercase" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="h-10 w-px bg-border/10 hidden md:block" />
        <div className="flex items-center gap-6 px-4">
           <div className="flex flex-col items-end">
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground">Active Filters</span>
              <span className="text-xl font-black text-foreground italic serif">{filteredCategories.length} Units</span>
           </div>
           <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl hover:bg-muted/50 text-muted-foreground">
              <ListFilter className="h-5 w-5" />
           </Button>
        </div>
      </div>

      {/* 4. CATEGORIES GRID */}
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-40 flex flex-col items-center justify-center gap-8">
             <div className="relative h-24 w-24">
                <div className="absolute inset-0 rounded-[2rem] border-4 border-primary/20 animate-spin transition-all duration-[3000ms]" />
                <div className="absolute inset-2 rounded-[1.5rem] border-4 border-secondary/20 animate-spin-slow" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <Loader2 className="h-10 w-10 text-primary animate-spin" />
                </div>
             </div>
             <p className="font-black uppercase tracking-[0.5em] text-[11px] text-muted-foreground animate-pulse">Synchronizing Registry...</p>
          </div>
        ) : filteredCategories.length > 0 ? (
          filteredCategories.map((category) => (
            <Card key={category.id} className="group relative bg-card/40 backdrop-blur-3xl border-2 border-border/10 rounded-[4rem] p-12 overflow-hidden hover:border-primary/30 transition-all duration-700 hover:shadow-3xl">
              {/* Decorative nodes */}
              <div className="absolute top-8 right-8 flex gap-1">
                 {[...Array(3)].map((_, i) => <div key={i} className="h-1 w-1 rounded-full bg-border/20" />)}
              </div>
              
              <div className="flex items-start justify-between mb-12">
                <div className="h-24 w-24 rounded-[2.5rem] bg-muted/30 flex items-center justify-center border-2 border-border/10 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-500 group-hover:scale-110">
                  <Layers className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-14 w-14 rounded-2xl bg-muted border border-border/10 hover:bg-primary hover:text-white transition-all text-muted-foreground"
                    onClick={() => {
                      setActiveCategory(category)
                      setNewName(category.name)
                      setNewDescription(category.description || "")
                      setEditOpen(true)
                    }}
                  >
                    <Pencil className="h-5 w-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-14 w-14 rounded-2xl bg-muted border border-border/10 hover:bg-destructive hover:text-white transition-all text-muted-foreground"
                    onClick={() => {
                        setActiveCategory(category)
                        setDeleteOpen(true)
                    }}
                  >
                    <Trash className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="space-y-6 mb-12">
                 <Badge className="bg-primary/10 text-primary border border-primary/20 font-black text-[9px] uppercase tracking-[0.4em] px-3 py-1 rounded-full">
                    ID: {category.id.slice(0, 6).toUpperCase()}
                 </Badge>
                <h3 className="text-4xl font-black text-foreground hover:text-primary transition-colors line-clamp-1 uppercase tracking-tighter leading-none">
                  {category.name}
                </h3>
                <p className="text-muted-foreground text-lg font-medium italic serif line-clamp-2 h-14 border-l-2 border-primary/20 pl-6 leading-relaxed">
                  {category.description || "Operational documentation for this taxonomy unit is currently blank."}
                </p>
              </div>

              <div className="flex items-end justify-between pt-10 border-t border-border/10">
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Attached Assets</span>
                  <div className="flex items-baseline gap-2">
                     <span className="text-4xl font-black text-foreground italic serif leading-none">{itemCountFallback(category)}</span>
                     <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">nodes</span>
                  </div>
                </div>
                
                <Button variant="ghost" className="h-14 px-8 rounded-2xl bg-muted/50 border border-border/10 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:bg-primary hover:text-white transition-all" asChild>
                   <Link href={`/dashboard/menu?category=${category.id}`}>
                      View Manifest <ArrowUpRight className="h-4 w-4 ml-3" />
                   </Link>
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-40 text-center bg-card/20 rounded-[5rem] border-4 border-dashed border-border/10 group hover:border-primary/20 transition-all duration-700">
            <div className="h-32 w-32 rounded-[3rem] bg-muted/30 flex items-center justify-center mx-auto mb-10 border-2 border-border/10 group-hover:scale-110 transition-transform duration-500">
               <Layers className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-5xl font-black text-foreground uppercase tracking-tighter mb-6 leading-none">Registry is <span className="text-muted-foreground italic font-serif lowercase tracking-normal">empty.</span></h3>
            <p className="text-muted-foreground font-medium max-w-sm mx-auto mb-12 text-xl italic serif leading-relaxed">
              "Establish your first taxonomic classification to begin structuring your digital menu hierarchy."
            </p>
            <Button onClick={() => setAddOpen(true)} className="h-24 px-16 rounded-[2.5rem] bg-primary text-white font-black uppercase text-sm tracking-[0.4em] hover:scale-105 transition-all shadow-3xl shadow-primary/30">
               Establish Taxonomy Unit
            </Button>
          </div>
        )}
      </div>

      {/* 5. REGISTRY UNIT SIDE-PANEL (SHEET) */}
      <Sheet open={addOpen || editOpen} onOpenChange={(open) => { if(!open) { setAddOpen(false); setEditOpen(false); } }}>
        <SheetContent className="w-full sm:max-w-2xl bg-card border-l border-border/10 p-0 overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="p-12 space-y-8 bg-muted/20 border-b border-border/10">
              <div className="flex items-center gap-4">
                <div className="h-10 w-1 bg-primary rounded-full" />
                <Badge className="bg-primary/10 text-primary border border-primary/20 font-black text-[10px] uppercase tracking-[0.4em] px-4 py-2 rounded-full">
                  Registry Engine
                </Badge>
              </div>
              <div className="space-y-4">
                <SheetTitle className="text-6xl font-black text-foreground tracking-tighter uppercase leading-none">
                  {editOpen ? "Modify" : "Establish"} <span className="text-muted-foreground italic font-serif lowercase tracking-normal">unit</span>
                </SheetTitle>
                <SheetDescription className="text-muted-foreground text-lg font-medium italic serif leading-relaxed">
                   "Define the cryptographic and operational identity for this taxonomic classification."
                </SheetDescription>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-12 space-y-12">
               {/* Metadata Section */}
               <section className="space-y-10 px-2">
                  <div className="flex items-center gap-4">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground">Manifest Identity</h4>
                  </div>

                  <div className="space-y-10">
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-1">Unit Classification Name</Label>
                      <Input
                        className="h-20 rounded-[1.5rem] border-2 border-border/10 bg-muted/40 text-2xl font-black px-8 text-foreground placeholder:text-muted-foreground/30 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all uppercase tracking-tighter shadow-xl"
                        placeholder="NAME OF CLASSIFICATION"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-1">Documentation Brief</Label>
                      <textarea
                        className="w-full min-h-[200px] rounded-[1.5rem] border-2 border-border/10 bg-muted/40 p-8 font-medium text-lg text-foreground focus:outline-none focus:border-primary/50 transition-all resize-none italic serif shadow-xl"
                        placeholder="Provide detailed documentation for this category..."
                        value={newDescription}
                        onChange={e => setNewDescription(e.target.value)}
                      />
                    </div>
                  </div>
               </section>

               {/* Tactical Advice */}
               <div className="p-8 rounded-[2rem] bg-muted/40 border border-border/5 flex gap-6 items-start">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                     <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-2">
                     <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Tactical Optimization</p>
                     <p className="text-sm text-muted-foreground font-medium italic serif leading-relaxed">
                        Categories with specific documentation and clear nomenclature improve structural navigation by up to 40% in digital menus.
                     </p>
                  </div>
               </div>
            </div>

            <div className="p-12 bg-muted/20 border-t border-border/10 flex gap-6">
              <Button 
                variant="ghost" 
                className="h-20 flex-1 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.3em] text-muted-foreground hover:bg-muted" 
                onClick={() => { setAddOpen(false); setEditOpen(false); }}
              >
                Abort Changes
              </Button>
              <Button 
                className="h-20 flex-[2] rounded-[1.5rem] bg-primary text-white font-black uppercase text-xs tracking-[0.3em] shadow-3xl shadow-primary/30 hover:scale-[1.02] transition-all"
                onClick={editOpen ? handleEdit : handleAdd}
                disabled={!newName.trim() || saving}
              >
                {saving ? (
                  <Loader2 className="animate-spin h-6 w-6" />
                ) : (
                  <>
                    {editOpen ? "Commit Registry Changes" : "Establish Taxonomy Unit"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[60]" />
        <AlertDialogContent className="bg-card border-2 border-border/10 rounded-[4rem] p-16 sm:max-w-xl shadow-3xl z-[70]">
          <AlertDialogHeader className="mb-12">
            <div className="h-24 w-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 border-2 border-primary/20">
               <Trash className="h-12 w-12 text-primary drop-shadow-[0_0_15px_rgba(230,57,70,0.5)]" />
            </div>
            <AlertDialogTitle className="text-5xl font-black text-foreground tracking-tighter text-center uppercase leading-none">
              Archive <span className="text-muted-foreground italic font-serif lowercase tracking-normal">unit?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-muted-foreground font-medium text-lg leading-relaxed mt-6 italic serif px-6">
              "Archiving this unit will destabilize the taxonomic classification of all associated culinary assets. This protocol cannot be easily reversed."
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col sm:flex-row gap-6">
            <AlertDialogCancel className="h-20 flex-1 rounded-[1.5rem] border-2 border-border/10 bg-transparent text-muted-foreground font-black uppercase text-xs tracking-[0.3em] hover:bg-muted">
              Abort Deletion
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="h-20 flex-1 rounded-[1.5rem] bg-primary text-white font-black uppercase text-xs tracking-[0.3em] hover:bg-destructive shadow-3xl shadow-primary/30"
            >
              Confirm Archive
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

