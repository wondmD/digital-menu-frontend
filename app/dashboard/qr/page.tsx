"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { apiFetch } from "@/lib/api-client"
import { Copy, Download, ExternalLink, Printer, QrCode, Smartphone } from "lucide-react"

type Restaurant = { id: string; name: string; slug?: string }

export default function QRPage() {
  const { data: session, status } = useSession()
  const token = (session?.user as any)?.accessToken as string | undefined
  const { toast } = useToast()

  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedId, setSelectedId] = useState("")
  const [loading, setLoading] = useState(true)

  const ready = status === "authenticated" && !!token

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
  }, [ready, token, selectedId, toast])

  const selected = useMemo(
    () => restaurants.find((r) => r.id === selectedId) || restaurants[0],
    [restaurants, selectedId],
  )

  const origin = typeof window !== "undefined" ? window.location.origin : ""
  const menuUrl = selected?.slug ? `${origin}/menu/${selected.slug}` : ""

  const handleCopy = async () => {
    if (!menuUrl) return
    if (!navigator?.clipboard) {
      toast({ title: "Clipboard unavailable", variant: "destructive" })
      return
    }
    try {
      await navigator.clipboard.writeText(menuUrl)
      toast({ title: "Link copied" })
    } catch (err: any) {
      toast({ title: "Could not copy link", description: err?.message, variant: "destructive" })
    }
  }

  if (!ready) {
    return <p className="text-sm text-muted-foreground">Sign in to view your QR codes.</p>
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">QR Code</h1>
          <p className="text-muted-foreground">Share a live link to your menu.</p>
        </div>
        <select
          className="h-10 rounded-md border border-primary/20 bg-white px-3 text-sm font-semibold text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          disabled={!restaurants.length || loading}
        >
          {restaurants.map((restaurant) => (
            <option key={restaurant.id} value={restaurant.id}>
              {restaurant.name}
            </option>
          ))}
        </select>
      </div>

      {!restaurants.length ? (
        <Card>
          <CardHeader>
            <CardTitle>No restaurants yet</CardTitle>
            <CardDescription>Create one to generate QR links.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="flex flex-col items-center justify-center p-8 text-center bg-background border-2">
            <div className="relative mb-6 rounded-2xl bg-white p-6 shadow-xl">
              <QrCode className="h-48 w-48 text-black" strokeWidth={1.5} />
              <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <QrCode className="h-full w-full" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">{selected?.name}</h3>
              <p className="text-sm text-muted-foreground">Scan to view digital menu</p>
            </div>
            <div className="mt-8 flex w-full gap-3">
              <Button className="flex-1 gap-2" disabled>
                <Download className="h-4 w-4" /> Download
              </Button>
              <Button variant="outline" className="flex-1 gap-2 bg-transparent" disabled>
                <Printer className="h-4 w-4" /> Print
              </Button>
            </div>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Menu Link</CardTitle>
                <CardDescription>The URL your QR points to.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
                  <span className="flex-1 truncate text-sm font-mono">{menuUrl || "No slug set"}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={handleCopy}
                    disabled={!menuUrl}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="link" className="h-auto p-0 text-primary" asChild disabled={!selected?.slug}>
                  <Link href={selected?.slug ? `/menu/${selected.slug}` : "#"} target="_blank" className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" /> Open live menu
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary" /> Display Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    Place QR codes in high-visibility areas like table tents or entrance posters.
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    Ensure the QR code is at least 2cm x 2cm for easy scanning.
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    Test the code with different lighting conditions before printing.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
