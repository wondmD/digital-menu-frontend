"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { ThemeToggle } from "@/components/theme-toggle"
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
import { cn } from "@/lib/utils"

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
    const id = (subscription.plan_id || "").toLowerCase()
    if (id.includes("bronze")) return "Bronze"
    if (id.includes("silver")) return "Silver"
    if (id.includes("gold")) return "Gold"
    return subscription.plan?.name || "Active"
  }

  const userName = session?.user?.name || "Proprietor"
  const userEmail = session?.user?.email || "—"
  const avatarFallback =
    (userName &&
      userName
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()) || "ME"

  if (!mounted) return null

  return (
    <SidebarProvider className="bg-background">
      <Sidebar className="border-r border-border bg-sidebar text-sidebar-foreground">
        <SidebarHeader className="p-6 h-auto border-none">
          <div className="flex items-center justify-between gap-3 px-2">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
                 <Coffee className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black uppercase tracking-[0.2em] text-foreground">MenuVista</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-primary italic">Charter Edition</span>
              </div>
            </Link>
            <ThemeToggle />
          </div>
        </SidebarHeader>

        <SidebarContent className="p-4 space-y-8 h-auto overflow-visible">
          <SidebarMenu className="gap-2">
            {NAV_ITEMS.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.url}
                  className={cn(
                    "flex h-12 w-full items-center gap-4 rounded-xl px-4 transition-all duration-300 border border-transparent",
                    pathname === item.url 
                      ? "bg-primary text-white shadow-lg shadow-primary/10 border-primary/20" 
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <Link href={item.url}>
                    <item.icon className={cn("h-5 w-5", pathname === item.url ? "text-white" : "text-muted-foreground")} />
                    <span className="text-xs font-bold uppercase tracking-widest">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>

          <div className="px-4 py-4 mt-auto">
             <div className="rounded-2xl bg-muted border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                   <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Registry Tier</span>
                   <Badge className="bg-primary/20 text-primary border-none text-[8px] font-black uppercase tracking-widest leading-none px-2 h-4">
                      {getPlanLabel()}
                   </Badge>
                </div>
                <Button variant="outline" size="sm" asChild className="w-full h-10 rounded-xl bg-background border-border text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted">
                   <Link href="/packages">Modify Access</Link>
                </Button>
             </div>
          </div>
        </SidebarContent>

        <SidebarFooter className="p-6 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton className="h-14 rounded-xl hover:bg-sidebar-accent transition-colors group">
                <Avatar className="h-9 w-9 border border-border shadow-lg">
                  <AvatarImage src={(session?.user as any)?.image || ""} />
                  <AvatarFallback className="bg-primary text-[10px] font-black text-white">{avatarFallback}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start truncate text-left ml-2 text-sidebar-foreground">
                  <span className="text-xs font-bold truncate w-24 tracking-wide">{userName}</span>
                  <span className="text-[9px] font-medium text-muted-foreground truncate w-24">{userEmail}</span>
                </div>
                <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="right"
              align="end"
              className="w-56 bg-popover border-border text-popover-foreground rounded-2xl shadow-2xl p-2"
            >
              <DropdownMenuLabel className="font-serif italic text-muted-foreground px-3 py-2">Proprietor Menu</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem asChild className="rounded-lg focus:bg-muted cursor-pointer">
                <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2">
                  <Settings className="h-4 w-4 text-muted-foreground" /> 
                  <span className="text-xs font-bold uppercase tracking-widest">Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem 
                onSelect={() => signOut({ callbackUrl: "/login" })}
                className="rounded-lg text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer flex items-center gap-3 px-3 py-2"
              >
                <LogOut className="h-4 w-4" /> 
                <span className="text-xs font-bold uppercase tracking-widest">End Session</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="bg-background flex flex-col min-h-screen">
        <header className="flex h-20 items-center justify-between px-8 border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="flex items-center gap-4">
             <SidebarTrigger className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg" />
             <div className="h-4 w-px bg-border" />
             <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                MenuVista / <span className="text-muted-foreground font-black">{pathname.split('/').pop()?.replace('-', ' ')}</span>
             </div>
          </div>
          
          <Button variant="outline" size="sm" asChild className="rounded-xl border-border bg-muted text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted h-10 px-6">
             <Link href="/menu/golden-leaf">Broadcast View</Link>
          </Button>
        </header>

        <main className="flex-1 overflow-auto p-8 md:p-12 relative">
           <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2" />
           <div className="relative z-10">
              {children}
           </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
