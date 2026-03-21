"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BarChart3, Handshake, LayoutDashboard, LogOut, Wallet, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { clearPartnerSession } from "@/lib/partner-auth"
import { cn } from "@/lib/utils"

const links = [
  { href: "/partner/dashboard/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/partner/dashboard/referrals", label: "Referrals", icon: Handshake },
  { href: "/partner/dashboard/earnings", label: "Earnings", icon: Wallet },
  { href: "/partner/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/partner/dashboard/toolkit", label: "Toolkit", icon: Wrench },
]

export function PartnerSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <aside className="w-full border-b border-border bg-card p-4 lg:h-screen lg:w-72 lg:border-b-0 lg:border-r lg:sticky lg:top-0">
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Partner Program</p>
        <h2 className="text-xl font-bold">Marketer Dashboard</h2>
      </div>

      <nav className="grid gap-2">
        {links.map((link) => {
          const active = pathname?.startsWith(link.href)
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          )
        })}
      </nav>

      <Button
        variant="outline"
        className="mt-8 w-full justify-start"
        onClick={() => {
          clearPartnerSession()
          router.replace("/partner/login")
        }}
      >
        <LogOut className="mr-2 h-4 w-4" /> Logout
      </Button>
    </aside>
  )
}
