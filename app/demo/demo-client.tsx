"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { 
  Smartphone, Sparkles, Zap, 
  CheckCircle2, Play, Layout 
} from "lucide-react"
import Link from "next/link"
import Template1 from "@/components/menu-templates/Template1"
import Template2 from "@/components/menu-templates/Template2"
import Template3 from "@/components/menu-templates/Template3"
import { MenuItem, Category, Restaurant } from "@/components/menu-templates/types"
import { Button } from "@/components/ui/button"
import { cn, getImageUrl } from "@/lib/utils"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const DEMO_HOTEL: Restaurant = {
  id: "demo-1",
  name: "Agelgil Luxury Resort",
  slug: "demo-luxury",
  description: "A demonstration of our premium digital menu experience.",
  image_url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=60",
}

const DEMO_CATEGORIES: Category[] = [
  {
    id: "cat-1",
    name: "Signature Cocktails",
    items: [
      {
        id: "item-1",
        name: "Emerald Mist",
        description: "A refreshing blend of garden mint, lime, and premium gin.",
        price: 12,
        currency: "USD",
        image_url: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=60",
        category_id: "cat-1",
        available: true,
        rating: 4.6,
        rating_count: 128,
      },
      {
        id: "item-2",
        name: "Sunset Royale",
        description: "Champagne infused with wild berry reduction and gold leaf.",
        price: 18,
        currency: "USD",
        image_url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&auto=format&fit=crop&q=60",
        category_id: "cat-1",
        available: true,
        rating: 4.3,
        rating_count: 76,
      }
    ]
  },
  {
    id: "cat-2",
    name: "Gourmet Starters",
    items: [
      {
        id: "item-3",
        name: "Truffle Arancini",
        description: "Crispy risotto balls filled with wild mushroom and truffle essence.",
        price: 15,
        currency: "USD",
        image_url: "https://images.unsplash.com/photo-1541529086526-db283c563270?w=800&auto=format&fit=crop&q=60",
        category_id: "cat-2",
        available: true,
        rating: 4.8,
        rating_count: 203,
      },
      {
        id: "item-4",
        name: "Seared Scallops",
        description: "Hokkaido scallops with pea purée and pancetta crisps.",
        price: 22,
        currency: "USD",
        image_url: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800&auto=format&fit=crop&q=60",
        category_id: "cat-2",
        available: true,
        rating: 4.4,
        rating_count: 91,
      }
    ]
  }
]

export default function DemoClient() {
  const [activeCategory, setActiveCategory] = useState(DEMO_CATEGORIES[0].id)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState("1")
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)

  const templateProps = {
    hotel: DEMO_HOTEL,
    categories: DEMO_CATEGORIES,
    activeCategory,
    onCategoryChange: setActiveCategory,
    onItemClick: setSelectedItem,
    searchQuery,
    onSearchChange: setSearchQuery,
    itemsLoading: false,
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Navbar />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest mb-6">
              <Play className="h-3 w-3 fill-primary" /> Interactive Experience
            </div>
            <h1 className="text-5xl md:text-7xl font-serif mb-6 italic">Agelgil Demo</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Explore our diverse menu templates and see how Agelgil can transform your restaurant's dining experience.
            </p>
          </motion.div>

          <section className="mb-32">
            <h2 className="text-3xl font-serif mb-12 text-center italic text-foreground">How It Works</h2>
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { icon: Smartphone, title: "1. Scan QR", desc: "Guests scan a unique QR code placed on their table." },
                { icon: Layout, title: "2. View Menu", desc: "Instantly browse through beautifully designed digital menus." },
                { icon: Zap, title: "3. Direct Updates", desc: "Change items, prices and availability in real-time." },
                { icon: Sparkles, title: "4. Delight Guests", desc: "Provide a modern, contactless, and elegant service." }
              ].map((step, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="p-8 rounded-[2rem] bg-card/50 border border-border text-center group hover:border-primary/20 transition-all backdrop-blur-sm"
                >
                  <div className="h-16 w-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                    <step.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </section>

          <section className="relative">
            <div className="flex flex-col lg:flex-row gap-12">
              {/* Controls */}
              <div className="lg:w-1/3 space-y-8">
                <div className="p-8 rounded-[2rem] bg-card/50 border border-border lg:sticky lg:top-32 backdrop-blur-sm">
                  <h3 className="text-2xl font-serif mb-6 italic text-foreground">Visual Explorer</h3>
                  <p className="text-muted-foreground mb-8 text-sm">
                    Toggle between our handcrafted templates to see which aesthetic fits your brand best.
                  </p>
                  
                  <div className="space-y-4">
                    {["1", "2", "3"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setSelectedTemplate(t)}
                        className={cn(
                          "w-full p-4 rounded-xl border flex items-center justify-between transition-all text-left",
                          selectedTemplate === t 
                            ? "bg-primary border-primary text-white shadow-xl shadow-primary/20" 
                            : "bg-muted/30 border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                        )}
                      >
                        <span className="font-bold">Template Style {t}</span>
                        {selectedTemplate === t && <CheckCircle2 className="h-5 w-5" />}
                      </button>
                    ))}
                  </div>

                  <div className="mt-12 pt-8 border-t border-border">
                    <Button className="w-full h-14 rounded-2xl text-[11px] font-black tracking-[0.2em] uppercase" asChild>
                      <Link href="/register">Join Platform</Link>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="lg:w-2/3 flex justify-center">
                 <div className="w-full max-w-full lg:max-w-[420px] lg:h-[850px] rounded-2xl lg:rounded-[3.5rem] overflow-visible lg:overflow-hidden border border-border/40 lg:border-[14px] lg:border-slate-900 dark:lg:border-slate-800 shadow-xl lg:shadow-3xl bg-background relative">
                    {/* Notch */}
                    <div className="hidden lg:flex absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-slate-900 dark:bg-slate-800 rounded-b-3xl z-50 items-center justify-center">
                        <div className="w-16 h-1.5 bg-slate-800 dark:bg-slate-700 rounded-full" />
                    </div>
                    
                    <div className="lg:h-full lg:overflow-auto lg:pt-2 no-scrollbar">
                        <div key={selectedTemplate} className="lg:h-full">
                            {selectedTemplate === "1" && <Template1 {...templateProps} />}
                            {selectedTemplate === "2" && <Template2 {...templateProps} />}
                            {selectedTemplate === "3" && <Template3 {...templateProps} />}
                        </div>
                    </div>
                 </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Dialog open={!!selectedItem} onOpenChange={(open) => {
        if (!open) {
          setSelectedItem(null)
        }
      }}>
        <DialogContent className="max-w-[95vw] sm:max-w-xl rounded-2xl p-0 overflow-hidden">
          {selectedItem && (
            <div className="grid gap-6">
              <div className="relative aspect-[4/3] w-full bg-muted">
                <Image
                  src={getImageUrl(selectedItem.image_url) || "/placeholder.svg"}
                  alt={selectedItem.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="px-6 pb-6">
                <DialogHeader className="text-left">
                  <DialogTitle className="text-2xl font-black tracking-tight">
                    {selectedItem.name}
                  </DialogTitle>
                  <DialogDescription className="text-sm leading-relaxed">
                    {selectedItem.description}
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-lg font-black text-primary">
                    {selectedItem.currency} {selectedItem.price.toFixed(2)}
                  </span>
                  {selectedItem.available === false && (
                    <span className="text-[10px] uppercase tracking-[0.2em] px-2 py-1 bg-muted text-muted-foreground rounded-full">
                      Unavailable
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
