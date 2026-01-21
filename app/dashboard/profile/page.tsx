"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { apiFetch } from "@/lib/api-client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Building2, 
  MapPin, 
  Phone, 
  Clock, 
  CheckCircle2, 
  LayoutGrid,
  UtensilsCrossed,
  ExternalLink,
  ChevronRight
} from "lucide-react"
import Link from "next/link"

type Restaurant = {
  id: string
  name: string
  slug?: string
  description?: string
  phone?: string
  address?: string
  city?: string
  country?: string
  is_published?: boolean
  created_at?: string
}

type Category = {
  id: string
  name: string
  description?: string
  is_active?: boolean
  items_count?: number
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const token = (session?.user as any)?.accessToken as string | undefined
  const { toast } = useToast()

  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedId, setSelectedId] = useState("")
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(false)

  const ready = status === "authenticated" && !!token

  const selected = useMemo(
    () => restaurants.find((r) => r.id === selectedId) || restaurants[0],
    [restaurants, selectedId],
  )

  useEffect(() => {
    if (!ready) return
    const load = async () => {
      try {
        setLoading(true)
        const res = await apiFetch<{ data: Restaurant[] }>("/my-restaurants", { token })
        const list = res?.data || []
        setRestaurants(list)
        if (list.length && !selectedId) setSelectedId(list[0].id)
      } catch (err: any) {
        toast({ title: "Could not load restaurants", description: err?.message, variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [ready, token, toast, selectedId])

  // Load Categories for the selected restaurant
  useEffect(() => {
    if (!token || !selectedId) return
    const loadDetails = async () => {
      try {
        setDataLoading(true)
        const res = await apiFetch<any>(`/my-restaurants/${selectedId}/categories`, { token })
        setCategories(Array.isArray(res) ? res : (res?.data || []))
      } catch (err: any) {
        console.error("Failed to load restaurant details", err)
      } finally {
        setDataLoading(false)
      }
    }
    loadDetails()
  }, [selectedId, token])

  if (!ready) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Building2 className="h-12 w-12 text-muted-foreground animate-pulse" />
        <p className="text-sm text-muted-foreground">Sign in to manage your profile.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-4xl font-extrabold tracking-tight">{selected?.name || "Restaurant Details"}</h1>
            <Badge variant={selected?.is_published ? "default" : "secondary"} className="mt-1">
              {selected?.is_published ? "Live" : "Draft"}
            </Badge>
          </div>
          <p className="text-muted-foreground text-lg hidden md:block">
            {selected?.description || "A brief overview of your restaurant, categories, and menu."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            className="h-10 rounded-md border border-primary/20 bg-background px-4 text-sm font-medium shadow-sm focus:ring-2 focus:ring-primary/20 transition-all"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            disabled={!restaurants.length}
          >
            {restaurants.map((res) => (
              <option key={res.id} value={res.id}>
                {res.name}
              </option>
            ))}
          </select>
          {selected?.slug && (
            <Button variant="outline" size="icon" asChild>
              <Link href={`/menu/${selected.slug}`} target="_blank" title="View Public Menu">
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {!restaurants.length ? (
        <Card className="border-dashed bg-muted/30">
          <CardHeader className="text-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle>No restaurants found</CardTitle>
            <CardDescription>You haven't added any restaurants to your profile yet.</CardDescription>
            <Button className="mt-4" asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-8">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="categories">Categories & Items</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6 space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" /> Location info
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <p className="font-semibold text-lg">{selected?.address || "No address set"}</p>
                      <p className="text-sm text-muted-foreground">
                        {selected?.city && selected?.country ? `${selected.city}, ${selected.country}` : "City/Country not specified"}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" /> Contact
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <p className="font-semibold text-lg">{selected?.phone || "No phone set"}</p>
                      <p className="text-sm text-muted-foreground">Support & Inquiries</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                       <Clock className="h-5 w-5 text-primary" />
                       Status & Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-6 sm:grid-cols-3">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Web Address</p>
                      <p className="font-medium">/menu/{selected?.slug || "pending"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Joined At</p>
                      <p className="font-medium">
                        {selected?.created_at ? new Date(selected.created_at).toLocaleDateString() : "Unknown"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Visibility</p>
                      <div className="flex items-center gap-2 pt-1">
                        {selected?.is_published ? (
                          <>
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                            <span className="text-sm font-medium">Published</span>
                          </>
                        ) : (
                          <>
                            <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                            <span className="text-sm font-medium">Under Review</span>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground italic leading-relaxed">
                      "{selected?.description || "You haven't provided a description for this restaurant yet. A good description helps customers know what to expect."}"
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="categories" className="mt-6">
                <div className="space-y-4">
                  {dataLoading ? (
                    <div className="py-12 text-center text-muted-foreground animate-pulse">
                      Loading data...
                    </div>
                  ) : categories.length > 0 ? (
                    categories.map((cat) => (
                      <Card key={cat.id} className="overflow-hidden hover:border-primary/50 transition-colors">
                        <div className="flex items-center justify-between p-4 bg-muted/20">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <LayoutGrid className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-bold">{cat.name}</h3>
                              <p className="text-xs text-muted-foreground">{cat.description || "No description"}</p>
                            </div>
                          </div>
                          <Link
                            href={`/dashboard/menu?restaurantId=${selectedId}&category=${cat.id}`}
                            className="text-xs flex items-center gap-1 text-primary font-semibold hover:underline"
                          >
                            Manage Items <ChevronRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed rounded-xl">
                      <UtensilsCrossed className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">No categories found for this restaurant.</p>
                      <Button variant="link" asChild>
                        <Link href="/dashboard/menu">Create your first category</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column: Mini Dashboard */}
          <div className="space-y-6">
            <Card className="bg-primary text-primary-foreground">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
                <CardDescription className="text-primary-foreground/70">
                  Direct links to frequent management tasks.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <Button variant="secondary" className="w-full justify-start gap-2" asChild>
                  <Link href="/dashboard/menu">
                    <UtensilsCrossed className="h-4 w-4" /> Manage Menu Studio
                  </Link>
                </Button>
                <Button variant="secondary" className="w-full justify-start gap-2" asChild>
                  <Link href="/dashboard/qr">
                    <CheckCircle2 className="h-4 w-4" /> QR Management
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Health Check</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Restaurant Info</span>
                  <Badge variant="outline" className="text-green-500 border-green-200">Complete</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Categories</span>
                  <Badge variant="outline" className={categories.length > 0 ? "text-green-500 border-green-200" : "text-yellow-500 border-yellow-200"}>
                    {categories.length > 0 ? "Setup" : "Missing"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Public Page</span>
                  <Badge variant="outline" className={selected?.is_published ? "text-green-500 border-green-200" : "text-yellow-500 border-yellow-200"}>
                    {selected?.is_published ? "Visible" : "Draft"}
                  </Badge>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                 <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-1000" 
                      style={{ width: `${(selected?.is_published ? 33 : 0) + (categories.length > 0 ? 33 : 0) + 34}%` }} 
                    />
                 </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
