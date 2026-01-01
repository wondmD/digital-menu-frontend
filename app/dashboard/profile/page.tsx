"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Upload, Instagram, Facebook, Globe } from "lucide-react"
import { MOCK_HOTELS } from "@/lib/mock-data"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"

export default function ProfilePage() {
  const [hotels, setHotels] = useState(MOCK_HOTELS)
  const [hotelId, setHotelId] = useState(hotels[0]?.id || "")
  const [addOpen, setAddOpen] = useState(false)
  const [draftHotel, setDraftHotel] = useState({
    name: "",
    address: "",
    phone: "",
    slug: "",
    description: "",
  })
  const selectedHotel = useMemo(() => hotels.find((h) => h.id === hotelId) || hotels[0], [hotelId, hotels])

  const handleAddHotel = () => {
    if (!draftHotel.name.trim()) return
    const id = `h-${Date.now()}`
    const newHotel = {
      id,
      name: draftHotel.name,
      logo: "/placeholder-logo.png",
      description: draftHotel.description || "Newly added property.",
      address: draftHotel.address || "",
      phone: draftHotel.phone || "",
      slug: draftHotel.slug || draftHotel.name.toLowerCase().replace(/\s+/g, "-"),
      socials: { instagram: "", facebook: "" },
    }
    const nextHotels = [...hotels, newHotel]
    setHotels(nextHotels)
    setHotelId(id)
    setDraftHotel({ name: "", address: "", phone: "", slug: "", description: "" })
    setAddOpen(false)
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-balance">Hotel Profiles</h1>
        <p className="text-muted-foreground">Manage multiple establishments under one account.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">Select a hotel to edit its public profile.</div>
        <div className="flex gap-2">
          <select
            className="h-10 rounded-md border border-primary/20 bg-white px-3 text-sm font-semibold text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={hotelId}
            onChange={(e) => setHotelId(e.target.value)}
          >
            {hotels.map((hotel) => (
              <option key={hotel.id} value={hotel.id}>
                {hotel.name}
              </option>
            ))}
          </select>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="whitespace-nowrap">Add hotel</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a new hotel</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Name</Label>
                  <Input
                    value={draftHotel.name}
                    onChange={(e) => setDraftHotel((d) => ({ ...d, name: e.target.value }))}
                    placeholder="Harborview Hotel"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Slug</Label>
                  <Input
                    value={draftHotel.slug}
                    onChange={(e) => setDraftHotel((d) => ({ ...d, slug: e.target.value }))}
                    placeholder="harborview"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Phone</Label>
                  <Input
                    value={draftHotel.phone}
                    onChange={(e) => setDraftHotel((d) => ({ ...d, phone: e.target.value }))}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Address</Label>
                  <Input
                    value={draftHotel.address}
                    onChange={(e) => setDraftHotel((d) => ({ ...d, address: e.target.value }))}
                    placeholder="123 Main St"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Description</Label>
                  <Textarea
                    value={draftHotel.description}
                    onChange={(e) => setDraftHotel((d) => ({ ...d, description: e.target.value }))}
                    placeholder="Brief description"
                  />
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setAddOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddHotel} disabled={!draftHotel.name.trim()}>
                  Save hotel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card key={selectedHotel.id}>
        <CardHeader>
          <CardTitle>General Information</CardTitle>
          <CardDescription>This information will be visible to customers when they scan your QR code.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed bg-muted/50 hover:bg-muted transition-colors cursor-pointer group">
              <div className="flex flex-col items-center gap-1 text-muted-foreground group-hover:text-primary transition-colors">
                <Upload className="h-6 w-6" />
                <span className="text-[10px] font-medium uppercase tracking-wider">Logo</span>
              </div>
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="text-sm font-medium">Establishment Logo</h4>
              <p className="text-xs text-muted-foreground">Recommended size: 512x512px. PNG or JPG.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hotel-name">Establishment Name</Label>
              <Input id="hotel-name" defaultValue={selectedHotel?.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" defaultValue={selectedHotel?.phone} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" defaultValue={selectedHotel?.address} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Tell your customers about your establishment..."
              className="min-h-[100px]"
              defaultValue={selectedHotel?.description}
            />
          </div>
        </CardContent>
      </Card>

      <Card key={`${selectedHotel.id}-socials`}>
        <CardHeader>
          <CardTitle>Social Media & Links</CardTitle>
          <CardDescription>Add links to your social profiles and website.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="instagram" className="flex items-center gap-2">
                <Instagram className="h-4 w-4" /> Instagram
              </Label>
              <Input id="instagram" placeholder="@yourhandle" defaultValue={selectedHotel?.socials.instagram} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebook" className="flex items-center gap-2">
                <Facebook className="h-4 w-4" /> Facebook
              </Label>
              <Input id="facebook" placeholder="yourpage" defaultValue={selectedHotel?.socials.facebook} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="website" className="flex items-center gap-2">
              <Globe className="h-4 w-4" /> Website
            </Label>
            <Input id="website" placeholder="https://www.yourcafe.com" />
          </div>
        </CardContent>
        <CardFooter className="border-t bg-muted/20 px-6 py-4">
          <Button className="ml-auto">Save Changes</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
