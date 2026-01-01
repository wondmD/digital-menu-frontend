"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { QrCode, Utensils, ListTree, Eye, TrendingUp, MapPin, Layers } from "lucide-react"
import { MOCK_CATEGORIES, MOCK_MENU_ITEMS, MOCK_MENUS } from "@/lib/mock-data"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function DashboardPage() {
  const [menus, setMenus] = useState(MOCK_MENUS)
  const [selectedMenuId, setSelectedMenuId] = useState(menus[0]?.id || "")
  const [addOpen, setAddOpen] = useState(false)
  const [draftMenu, setDraftMenu] = useState({ name: "", location: "", status: "Live", slug: "" })

  const selectedMenu = useMemo(() => menus.find((m) => m.id === selectedMenuId) || menus[0], [menus, selectedMenuId])
  const itemsForMenu = useMemo(() => MOCK_MENU_ITEMS.filter((i) => i.menuId === selectedMenu?.id), [selectedMenu])
  const categoriesForMenu = useMemo(() => {
    const ids = new Set(itemsForMenu.map((i) => i.categoryId))
    return MOCK_CATEGORIES.filter((c) => ids.has(c.id))
  }, [itemsForMenu])
  const liveMenus = menus.filter((m) => m.status === "Live")
  const handleAddMenu = () => {
    if (!draftMenu.name.trim()) return
    const id = `menu-${Date.now()}`
    const next = {
      id,
      name: draftMenu.name,
      slug: draftMenu.slug || draftMenu.name.toLowerCase().replace(/\s+/g, "-"),
      location: draftMenu.location || "",
      status: draftMenu.status as "Live" | "Draft",
      scans30d: 0,
    }
    const nextMenus = [...menus, next]
    setMenus(nextMenus)
    setSelectedMenuId(id)
    setDraftMenu({ name: "", location: "", status: "Live", slug: "" })
    setAddOpen(false)
  }
  const stats = [
    {
      title: "Categories",
      value: categoriesForMenu.length,
      icon: ListTree,
      description: `In ${selectedMenu?.name || "menu"}`,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Active Items",
      value: itemsForMenu.filter((i) => i.available).length,
      icon: Utensils,
      description: "Currently live",
      color: "bg-green-50 text-green-600",
    },
    {
      title: "Menu Scans",
      value: (selectedMenu?.scans30d || 0).toLocaleString(),
      icon: Eye,
      description: "Last 30 days",
      color: "bg-teal-50 text-teal-600",
    },
    {
      title: "Live Menus",
      value: liveMenus.length,
      icon: QrCode,
      description: "Across account",
      color: "bg-primary/5 text-primary",
    },
  ]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-serif text-foreground tracking-tight">Overview</h1>
            <p className="text-muted-foreground text-lg font-medium">Manage all menus under one account.</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              className="h-11 rounded-lg border border-primary/20 bg-white px-3 text-sm font-semibold text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={selectedMenuId}
              onChange={(e) => setSelectedMenuId(e.target.value)}
            >
              {menus.map((menu) => (
                <option key={menu.id} value={menu.id}>
                  {menu.name} ({menu.status})
                </option>
              ))}
            </select>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Layers className="h-4 w-4" /> Add menu
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add a new menu</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label>Name</Label>
                    <Input
                      value={draftMenu.name}
                      onChange={(e) => setDraftMenu((d) => ({ ...d, name: e.target.value }))}
                      placeholder="Harborview Brunch"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Slug</Label>
                    <Input
                      value={draftMenu.slug}
                      onChange={(e) => setDraftMenu((d) => ({ ...d, slug: e.target.value }))}
                      placeholder="harborview-brunch"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Location</Label>
                    <Input
                      value={draftMenu.location}
                      onChange={(e) => setDraftMenu((d) => ({ ...d, location: e.target.value }))}
                      placeholder="Downtown"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Status</Label>
                    <select
                      className="h-10 w-full rounded-md border border-primary/20 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      value={draftMenu.status}
                      onChange={(e) => setDraftMenu((d) => ({ ...d, status: e.target.value }))}
                    >
                      <option value="Live">Live</option>
                      <option value="Draft">Draft</option>
                    </select>
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button variant="outline" onClick={() => setAddOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddMenu} disabled={!draftMenu.name.trim()}>
                    Save menu
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
                <p className="text-xs text-emerald-600 font-medium">+12% from last week</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Your menus</h2>
          <p className="text-sm text-muted-foreground">Manage multiple venues under one account.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {menus.map((menu) => (
            <Card key={menu.id} className="border-primary/5 shadow-sm hover:shadow-md transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-lg font-semibold">{menu.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1 text-xs">
                    <MapPin className="h-3.5 w-3.5 text-primary" /> {menu.location}
                  </CardDescription>
                </div>
                <Badge
                  className={menu.status === "Live" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}
                >
                  {menu.status}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Last 30d scans</span>
                  <span className="font-semibold text-foreground">{menu.scans30d.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Categories</span>
                  <span className="font-semibold text-foreground">
                    {new Set(MOCK_MENU_ITEMS.filter((i) => i.menuId === menu.id).map((i) => i.categoryId)).size}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Items</span>
                  <span className="font-semibold text-foreground">
                    {MOCK_MENU_ITEMS.filter((i) => i.menuId === menu.id).length}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="md:col-span-4 border-primary/5 shadow-sm overflow-hidden">
          <CardHeader className="bg-primary/[0.02] border-b border-primary/5">
            <CardTitle className="font-serif text-xl">Recent Activity</CardTitle>
            <CardDescription>Real-time updates from your dining floor.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 group cursor-pointer">
                  <div className="rounded-full bg-primary/10 p-2.5 text-primary transition-colors group-hover:bg-primary/20">
                    <QrCode className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-semibold text-primary leading-none">
                      Table {i + 4} scanned the menu
                    </p>
                    <p className="text-xs text-muted-foreground font-medium">{i * 12} minutes ago</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="md:col-span-3 border-primary/5 shadow-sm bg-primary/5 border-0">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Growth Tips</CardTitle>
            <CardDescription>Curated insights for your success.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-primary/10 transition-transform hover:scale-[1.02] cursor-default">
              <p className="font-bold text-primary">Capture the freshness</p>
              <p className="text-muted-foreground text-xs mt-1.5 leading-relaxed">
                Seasonal updates with vibrant photos can increase engagement by up to 40%.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-primary/10 transition-transform hover:scale-[1.02] cursor-default">
              <p className="font-bold text-primary">Highlight specialities</p>
              <p className="text-muted-foreground text-xs mt-1.5 leading-relaxed">
                Add a &quot;Chef&apos;s Recommendations&quot; tag to your most profitable items.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
