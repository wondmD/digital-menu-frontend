"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import {
  LayoutDashboard,
  Utensils,
  ListTree,
  QrCode,
  Settings,
  Hotel,
  LogOut,
  Coffee,
  ChevronRight,
} from "lucide-react"

import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider, 
  SidebarTrigger, 
  SidebarInset 
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { apiFetch } from "@/lib/api-client"

const NAV_ITEMS = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "My Restaurants",
    url: "/dashboard/profile",
    icon: Hotel,
  },
  {
    title: "Menu Studio",
    url: "/dashboard/menu",
    icon: Utensils,
  },
  {
    title: "QR Code",
    url: "/dashboard/qr",
    icon: QrCode,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
  },
]

export function AppSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mounted, setMounted] = React.useState(false)
  const [subscription, setSubscription] = React.useState<any>(null)

  React.useEffect(() => {
    setMounted(true)
    
    const token = (session?.user as any)?.accessToken
    if (token) {
      apiFetch<any>("/subscription/me", { token })
        .then((res) => setSubscription(res?.data || res))
        .catch(() => {})
    }
  }, [session])

  const getPlanLabel = () => {
    if (!subscription) return "Trial"
    const id = subscription.plan_id || ""
    if (id.includes("bronze")) return "Bronze"
    if (id.includes("silver")) return "Silver"
    if (id.includes("gold")) return "Gold"
    return subscription.plan?.name || "Active"
  }

  const userName = session?.user?.name || "Account"
  const userEmail = session?.user?.email || "—"
  const avatarFallback =
    (userName &&
      userName
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()) || "ME"

  // Avoid hydration mismatches between server and client (e.g., sidebar open state or Radix IDs).
  if (!mounted) return null

  return (
    <SidebarProvider>
      <Sidebar variant="inset" className="border-r-0 bg-secondary/30">
        <SidebarHeader className="h-16 border-b border-primary/10 p-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Coffee className="size-5" />
            </div>
            <div className="flex flex-col gap-0.5 leading-none">
              <span className="font-serif font-bold text-primary-foreground tracking-tight">MenuQR</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Establishment
              </span>
            </div>
          </Link>
        </SidebarHeader>
        <SidebarContent className="px-2 pt-4">
          <SidebarMenu className="gap-1">
            {NAV_ITEMS.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.url}
                  tooltip={item.title}
                  className="rounded-xl transition-all duration-200 hover:bg-primary/5 data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                >
                  <Link href={item.url}>
                    <item.icon
                      className={`size-4 ${pathname === item.url ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <span className="font-medium">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="border-t border-primary/10 p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton size="lg" className="data-[state=open]:bg-primary/5 rounded-xl transition-colors">
                    <Avatar className="size-8 rounded-lg">
                      <AvatarImage src={(session?.user as any)?.image || "/avatar.png"} alt={userName} />
                      <AvatarFallback className="rounded-lg">{avatarFallback}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-semibold text-foreground">{userName}</span>
                        <Badge variant="outline" className="h-4 px-1.5 text-[8px] uppercase font-bold text-primary border-primary/20 bg-primary/5">
                          {getPlanLabel()}
                        </Badge>
                      </div>
                      <span className="truncate text-xs text-muted-foreground">{userEmail}</span>
                    </div>
                    <ChevronRight className="ml-auto size-4 text-muted-foreground" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" side="right" align="end" sideOffset={4}>
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onSelect={(e) => {
                      e.preventDefault()
                      signOut({ callbackUrl: "/login" })
                    }}
                  >
                    <LogOut className="mr-2 size-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-white">
        <header className="flex h-16 shrink-0 items-center gap-2 px-6 transition-[width,height] ease-linear border-b border-primary/5 bg-white/50 backdrop-blur-sm sticky top-0 z-30">
          <SidebarTrigger className="-ml-1 text-primary hover:bg-primary/5" />
          <div className="ml-auto flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex border-primary/20 text-primary hover:bg-primary/5 font-medium rounded-full px-4 bg-transparent"
              asChild
            >
              <Link href="/menu/golden-leaf">View Live Menu</Link>
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6 md:p-8 bg-gradient-to-br from-white to-secondary/20">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
