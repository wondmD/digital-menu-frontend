"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, Filter, MoreVertical, Edit, Trash2 } from "lucide-react"
import { MOCK_CATEGORIES, MOCK_MENU_ITEMS, MOCK_MENUS } from "@/lib/mock-data"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Image from "next/image"
import { Suspense, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export default function MenuItemsPage() {
  const [menus] = useState(MOCK_MENUS)
  const [menuId, setMenuId] = useState(menus[0]?.id || "")
  const [categories, setCategories] = useState(MOCK_CATEGORIES)
  const [addCatOpen, setAddCatOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")

  const itemsForMenu = useMemo(
    () => MOCK_MENU_ITEMS.filter((item) => !menuId || item.menuId === menuId),
    [menuId],
  )

  const categoriesForMenu = useMemo(() => {
    const ids = new Set(itemsForMenu.map((i) => i.categoryId))
    return categories.filter((c) => ids.has(c.id))
  }, [categories, itemsForMenu])

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return
    const id = `c-${Date.now()}`
    const next = { id, name: newCategoryName, itemCount: 0 }
    setCategories((prev) => [...prev, next])
    setNewCategoryName("")
    setAddCatOpen(false)
  }

  return (
    <Suspense fallback={null}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-balance">Menu Items</h1>
            <p className="text-muted-foreground">Manage dishes for any of your menus under one account.</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              className="h-10 rounded-md border bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              value={menuId}
              onChange={(e) => setMenuId(e.target.value)}
            >
              {menus.map((menu) => (
                <option key={menu.id} value={menu.id}>
                  {menu.name} ({menu.status})
                </option>
              ))}
            </select>
            <Button className="gap-2 shrink-0">
              <Plus className="h-4 w-4" /> Add Menu Item
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search menu items..." className="pl-10" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <div className="flex items-center gap-2">
              <select className="h-9 rounded-md border bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="">All Categories</option>
                {categoriesForMenu.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <Dialog open={addCatOpen} onOpenChange={setAddCatOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="h-4 w-4" /> Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add category</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Desserts"
                    />
                  </div>
                  <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => setAddCatOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
                      Save
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {itemsForMenu.map((item) => (
            <Card key={item.id} className="overflow-hidden bg-card">
              <div className="relative aspect-square">
                <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                <div className="absolute right-2 top-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 rounded-full shadow-md bg-background/80 backdrop-blur"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2">
                        <Edit className="h-4 w-4" /> Edit Item
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-destructive">
                        <Trash2 className="h-4 w-4" /> Delete Item
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <CardHeader className="p-4 pb-0">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg line-clamp-1">{item.name}</CardTitle>
                  <span className="font-bold text-primary">${item.price.toFixed(2)}</span>
                </div>
                <CardDescription className="line-clamp-2 min-h-[2.5rem]">{item.description}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-4">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/20">
                    {MOCK_CATEGORIES.find((c) => c.id === item.categoryId)?.name}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{item.available ? "Live" : "Hidden"}</span>
                    <Switch checked={item.available} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {/* Empty State / Add Card */}
          <button className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-muted p-12 text-center hover:border-primary/50 hover:bg-primary/5 transition-all">
            <div className="rounded-full bg-muted p-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">Add New Item</p>
              <p className="text-xs text-muted-foreground">Add another delicious dish to your menu.</p>
            </div>
          </button>
        </div>
      </div>
    </Suspense>
  )
}
