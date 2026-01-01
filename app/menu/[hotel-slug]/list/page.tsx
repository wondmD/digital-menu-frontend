"use client"

import { useState, useRef } from "react"
import { MOCK_HOTEL, MOCK_CATEGORIES, MOCK_MENU_ITEMS } from "@/lib/mock-data"
import { ArrowLeft, Search, Info, Coffee, Leaf } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Suspense, use } from "react"

export default function MenuListViewPage({ params }: { params: Promise<{ "hotel-slug": string }> }) {
  const resolvedParams = use(params)
  const hotelSlug = resolvedParams["hotel-slug"]

  const [activeCategory, setActiveCategory] = useState(MOCK_CATEGORIES[0].id)
  const [searchQuery, setSearchQuery] = useState("")
  const mainRef = useRef<HTMLDivElement | null>(null)

  const filteredItems = MOCK_MENU_ITEMS.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const scrollToCategory = (id: string) => {
    setActiveCategory(id)
    requestAnimationFrame(() => {
      if (mainRef.current) {
        mainRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    })
  }

  return (
    <Suspense fallback={null}>
      <div className="min-h-screen bg-[#FDFCF8] pb-24 font-sans antialiased">
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-primary/10 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <Button variant="ghost" size="icon" className="-ml-3 h-12 w-12 rounded-2xl hover:bg-primary/5" asChild>
              <Link href={`/menu/${hotelSlug}`}>
                <ArrowLeft className="h-6 w-6 text-primary" />
              </Link>
            </Button>
            <div className="flex flex-col items-center text-center">
              <p className="text-[11px] uppercase tracking-[0.3em] text-primary font-semibold">Menu</p>
              <h2 className="text-xl font-serif text-primary truncate max-w-[260px]">{MOCK_HOTEL.name}</h2>
            </div>
            <Button variant="ghost" size="icon" className="-mr-3 h-12 w-12 rounded-2xl hover:bg-primary/5">
              <Info className="h-6 w-6 text-primary" />
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 lg:px-10">
          <section className="mt-10 grid gap-6 rounded-3xl bg-white/70 p-6 shadow-lg ring-1 ring-primary/5 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" /> Seasonal highlights
              </div>
              <h1 className="text-4xl font-serif font-normal leading-tight text-primary">Explore our crafted menu</h1>
              <p className="max-w-2xl text-lg text-muted-foreground">
                Discover chef-driven dishes, curated beverages, and signatures designed to elevate every visit.
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 rounded-2xl bg-primary/5 px-4 py-2 text-sm font-semibold text-primary">
                  <Leaf className="h-4 w-4" />
                  {MOCK_CATEGORIES.length} categories
                </div>
                <div className="inline-flex items-center gap-2 rounded-2xl bg-primary/5 px-4 py-2 text-sm font-semibold text-primary">
                  <Coffee className="h-4 w-4" />
                  {filteredItems.length} items available
                </div>
              </div>
            </div>
            <div className="space-y-4 rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 via-white to-primary/5 p-4 shadow-inner">
              <div className="text-sm font-semibold text-primary">Search & filter</div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary/40" />
                <Input
                  className="pl-12 h-12 rounded-2xl bg-white border-primary/10 focus-visible:ring-2 focus-visible:ring-primary/20 text-base"
                  placeholder="Find dishes, drinks, or specials"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {MOCK_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => scrollToCategory(category.id)}
                    className={cn(
                      "rounded-full border px-3 py-2 text-sm font-semibold transition-all",
                      activeCategory === category.id
                        ? "border-primary bg-primary text-white shadow"
                        : "border-primary/10 bg-white text-primary hover:border-primary/40",
                    )}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-10 grid gap-8 lg:grid-cols-[1fr_2.25fr]" ref={mainRef}>
            <aside className="lg:sticky lg:top-24 space-y-6">
              <div className="rounded-3xl border border-primary/10 bg-white/80 p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.25em] text-primary font-bold">Browse</p>
                <div className="mt-4 flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
                  {MOCK_CATEGORIES.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => scrollToCategory(category.id)}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition-all",
                        activeCategory === category.id
                          ? "bg-primary text-white shadow"
                          : "bg-primary/5 text-primary hover:bg-primary/10",
                      )}
                    >
                      <span>{category.name}</span>
                      <span className="text-xs opacity-80">
                        {filteredItems.filter((i) => i.categoryId === category.id).length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-primary/10 bg-primary/5 p-5 shadow-sm">
                <p className="text-sm font-semibold text-primary">Chef recommendation</p>
                <p className="mt-2 text-muted-foreground text-sm">
                  Try our signature picks crafted for the season. Rotates weekly.
                </p>
                <div className="mt-4 flex items-center justify-between rounded-2xl bg-white p-4 shadow">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">Seasonal Special</p>
                    <p className="text-xs text-muted-foreground">Ask your server for today’s pairing.</p>
                  </div>
                  <Badge className="bg-primary text-white">Featured</Badge>
                </div>
              </div>
            </aside>

            <div className="space-y-12">
              {(() => {
                const currentCategory = MOCK_CATEGORIES.find((c) => c.id === activeCategory) || MOCK_CATEGORIES[0]
                const categoryItems = filteredItems.filter((item) => item.categoryId === currentCategory.id)

                if (!currentCategory) return null

                return (
                  <section key={currentCategory.id} className="space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                        <Leaf className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-serif font-normal text-primary">{currentCategory.name}</h3>
                        <p className="text-sm text-muted-foreground">Handpicked favorites and new arrivals.</p>
                      </div>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                      {categoryItems.map((item) => (
                        <div
                          key={item.id}
                          className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-primary/10 bg-white shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl"
                        >
                          <div className="relative aspect-[4/3] w-full overflow-hidden">
                            <Image
                              src={item.image || "/placeholder.svg"}
                              alt={item.name}
                              fill
                              className={cn(
                                "object-cover transition-transform duration-700 group-hover:scale-110",
                                !item.available && "grayscale opacity-60",
                              )}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-70" />
                            <div className="absolute left-4 top-4 flex items-center gap-2">
                              {!item.available && (
                                <Badge className="bg-white/90 text-primary" variant="secondary">
                                  Out of season
                                </Badge>
                              )}
                              {item.available && (
                                <Badge className="bg-primary text-white shadow">Popular</Badge>
                              )}
                            </div>
                            <div className="absolute right-4 bottom-4">
                              <Badge className="h-9 px-4 text-base font-semibold bg-white text-primary shadow border-primary/10">
                                ${item.price.toFixed(2)}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex flex-1 flex-col gap-3 p-5">
                            <div className="flex items-start justify-between gap-3">
                              <h4 className="text-xl font-semibold text-foreground leading-tight">{item.name}</h4>
                              <span className="text-xs rounded-full bg-primary/5 px-3 py-1 font-semibold text-primary">
                                {currentCategory.name}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{item.description}</p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Prep: 10-15 min</span>
                              <span>Serves 1-2</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {categoryItems.length === 0 && (
                      <div className="py-16 text-center">
                        <div className="mx-auto h-16 w-16 rounded-full bg-primary/5 text-primary flex items-center justify-center mb-4">
                          <Search className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-semibold">No items found</h3>
                        <p className="text-sm text-muted-foreground">Try a different search or switch categories.</p>
                      </div>
                    )}
                  </section>
                )
              })()}

              {filteredItems.length === 0 && (
                <div className="py-16 text-center">
                  <div className="mx-auto h-16 w-16 rounded-full bg-primary/5 text-primary flex items-center justify-center mb-4">
                    <Search className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold">No items found</h3>
                  <p className="text-sm text-muted-foreground">Try a different search or filter.</p>
                </div>
              )}
            </div>
          </section>
        </main>

        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center bg-primary text-white rounded-[2rem] px-8 py-4 shadow-2xl shadow-primary/40 border border-white/20 backdrop-blur-sm gap-5 transition-transform hover:scale-105 active:scale-95">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-80">Experience</span>
              <span className="text-sm font-bold leading-none tracking-tight">Handcrafted by MenuQR</span>
            </div>
            <div className="h-10 w-px bg-white/20" />
            <Coffee className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>
    </Suspense>
  )
}
