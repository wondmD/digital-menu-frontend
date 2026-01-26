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
import { Logo } from "@/components/logo"
import { Zap, AlertTriangle, ArrowRight } from "lucide-react"

const NAV_ITEMS = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Restaurants",
    url: "/dashboard/profile",
    icon: Hotel,
  },
  {
    title: "Menus",
    url: "/dashboard/menu",
    icon: Utensils,
  },
  {
    title: "QR Codes",
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

  const getDaysLeft = () => {
    if (!subscription || !subscription.expires_at) return null
    if (subscription.plan_slug !== 'free-trial' && !subscription.plan?.name?.toLowerCase().includes('trial')) return null
    
    const expiry = new Date(subscription.expires_at)
    const now = new Date()
    const diff = expiry.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days > 0 ? days : 0
  }

  const getPlanLabel = () => {
    if (!subscription) return "Trial"
    const id = (subscription.plan_id || "").toLowerCase()
    const slug = (subscription.plan_slug || "").toLowerCase()
    
    if (id.includes("bronze") || slug.includes("bronze")) return "Bronze"
    if (id.includes("silver") || slug.includes("silver")) return "Silver"
    if (id.includes("gold") || slug.includes("gold")) return "Gold"
    return subscription.plan?.name || (slug === 'free-trial' ? 'Free Trial' : "Active")
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
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <Logo width={32} height={32} className="-ml-1" />
              <span className="text-lg font-serif text-primary italic transition-all group-hover:scale-105 active:scale-95">አገልግል</span>
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
                      ? "bg-primary text-white shadow-lg shadow-primary/10 border-primary/40" 
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
                   <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Current plan</span>
                      {getDaysLeft() !== null && (
                         <span className="text-[10px] font-bold text-primary italic leading-none">
                            {getDaysLeft()} days left
                         </span>
                      )}
                   </div>
                   <Badge className="bg-primary/20 text-primary border-none text-[8px] font-black uppercase tracking-widest leading-none px-2 h-4 self-start">
                      {getPlanLabel()}
                   </Badge>
                </div>
                <Button variant="outline" size="sm" asChild className="w-full h-10 rounded-xl bg-background border-border text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted">
                   <Link href="/packages">Change plan</Link>
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
              <DropdownMenuLabel className="font-serif italic text-muted-foreground px-3 py-2">Account options</DropdownMenuLabel>
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
                <span className="text-xs font-bold uppercase tracking-widest">Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="bg-background flex flex-col min-h-screen transition-all duration-300">
        {getDaysLeft() !== null && (
          <div className="w-full bg-primary py-1.5 px-6 flex items-center justify-between shadow-lg relative z-[60]">
             <div className="flex items-center gap-2">
                <Zap className="h-3 w-3 text-white animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-white">
                  Free Trial: <span className="underline decoration-white/30 underline-offset-4">{getDaysLeft()} Days Left</span>
                </span>
             </div>
             <Link href="/packages" className="text-[8px] font-black uppercase tracking-widest text-white/90 hover:text-white flex items-center gap-1 transition-colors group">
                Upgrade Plan <ArrowRight className="h-2.5 w-2.5 group-hover:translate-x-0.5 transition-transform" />
             </Link>
          </div>
        )}
        <header className="flex h-16 md:h-20 items-center justify-between px-4 md:px-8 border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="flex items-center gap-2 md:gap-4">
             <SidebarTrigger className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg" />
             <div className="h-4 w-px bg-border hidden sm:block" />
             <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-muted-foreground truncate max-w-[150px] sm:max-w-none">
                <span className="hidden sm:inline">Dashboard / </span>
                <span className="text-muted-foreground font-black uppercase">{pathname.split('/').pop()?.replace('-', ' ')}</span>
             </div>
          </div>
          
          <Button variant="outline" size="sm" asChild className="rounded-xl border-border bg-muted text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted h-8 md:h-10 px-4 md:px-6">
             <Link href="/menu/golden-leaf">View site</Link>
          </Button>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-12 relative">
           <div className="absolute top-0 right-0 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-primary/5 blur-[80px] md:blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2" />
           <div className="relative z-10 h-full">
              {children}
           </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
