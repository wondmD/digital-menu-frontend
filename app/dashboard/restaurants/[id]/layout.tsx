"use client"

import { usePathname, useParams } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { 
  Settings, 
  LayoutGrid, 
  BarChart3, 
  QrCode, 
  ExternalLink,
  ChevronLeft,
  Info,
  Palette,
  MapPin,
  Image as ImageIcon
} from "lucide-react"

export default function RestaurantDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const params = useParams()
  const restaurantId = params.id as string

  const navItems = [
    { 
      label: "General Info", 
      href: `/dashboard/restaurants/${restaurantId}`, 
      icon: Info
    },
    { 
      label: "Branding & Visuals", 
      href: `/dashboard/restaurants/${restaurantId}/branding`, 
      icon: Palette
    },
    { 
      label: "Contact & Location", 
      href: `/dashboard/restaurants/${restaurantId}/contact`, 
      icon: MapPin 
    },
    { 
      label: "Photo Gallery", 
      href: `/dashboard/restaurants/${restaurantId}/gallery`, 
      icon: ImageIcon
    }
  ]

  return (
    <div className="flex flex-col space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <Link 
          href="/dashboard/profile"
          className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Overview
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-64 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                  isActive 
                    ? "bg-primary text-white shadow-lg shadow-primary/20" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </aside>

        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
