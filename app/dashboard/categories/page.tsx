"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { Plus, Edit, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">Menu Categories</h1>
          <p className="text-muted-foreground">Organize your menu items for each restaurant.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="h-10 rounded-md border bg-white px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            value={restaurantId}
            onChange={(e) => setRestaurantId(e.target.value)}
            disabled={!restaurants.length}
          >
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" disabled={!restaurantId}>
                <Plus className="h-4 w-4" /> Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
                <DialogDescription>Create a new group for your menu items.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Category Name</Label>
                  <Input
                    id="name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Cold Drinks, Main Courses"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="desc">Description (optional)</Label>
                  <Input
                    id="desc"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Short summary"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddOpen(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleAdd} disabled={!newName.trim() || saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Category"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
          <CardDescription>
            {selectedRestaurant ? `For ${selectedRestaurant.name}` : "Select a restaurant to view categories."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading...
            </div>
          ) : categories.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-muted-foreground">{category.description || "—"}</TableCell>
                    <TableCell>{itemCountFallback(category)} items</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setActiveCategory(category)
                            setNewName(category.name)
                            setNewDescription(category.description || "")
                            setEditOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => {
                            setActiveCategory(category)
                            setDeleteOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-lg">No categories found</p>
                <p className="text-sm text-muted-foreground">Get started by creating your first category.</p>
              </div>
              <Button onClick={() => setAddOpen(true)} className="rounded-xl">
                 Create Category
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Category Name</Label>
              <Input
                id="edit-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-desc">Description</Label>
              <Input
                id="edit-desc"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={!newName.trim() || saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              Any items in this category will become uncategorized. This action is irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              disabled={saving}
              onClick={handleDelete}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
