"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import { apiFetch } from "@/lib/api-client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Save, MapPin, Phone, Mail, Globe } from "lucide-react"
import { DEFAULT_TIMEZONE, findRestaurantById } from "@/lib/restaurant-normalizers"

export default function ContactLocationPage() {
  const params = useParams()
  const id = params.id as string
  const { data: session } = useSession()
  const token = (session?.user as any)?.accessToken
  const { toast } = useToast()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState({
    phone: "",
    email: "",
    website: "",
    address: "",
    city: "",
    country: "",
    timezone: DEFAULT_TIMEZONE,
  })

  useEffect(() => {
    if (!token || !id) return
    const load = async () => {
      try {
        setLoading(true)
        // Direct GET /my-restaurants/:id 404s, so we use the list.
        const res = await apiFetch<any>("/my-restaurants", { token })
        const d = findRestaurantById(res, id)

        if (d) {
          setData({
            phone: d.phone || "",
            email: d.email || "",
            website: d.website || "",
            address: d.address || "",
            city: d.city || "",
            country: d.country || "",
            timezone: d.timezone || DEFAULT_TIMEZONE,
          })
        } else {
          throw new Error("Restaurant not found in your account")
        }
      } catch (err: any) {
        console.error("Fetch error:", err)
        toast({ 
          title: "Error", 
          description: `Failed to load contact info: ${err.message}`, 
          variant: "destructive" 
        })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token, id])

  const handleSave = async () => {
    if (!token || !id) return
    try {
      setSaving(true)

      const payload = new FormData()
      payload.append("phone", data.phone)
      payload.append("email", data.email)
      payload.append("website", data.website)
      payload.append("address", data.address)
      payload.append("city", data.city)
      payload.append("country", data.country)
      payload.append("timezone", data.timezone || DEFAULT_TIMEZONE)

      await apiFetch(`/my-restaurants/${id}`, {
        method: "PATCH",
        token,
        body: payload
      })
      toast({ title: "Success", description: "Contact details updated" })
      router.refresh()
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 text-foreground">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contact & Location</h1>
        <p className="text-muted-foreground font-medium">How customers can find and reach you.</p>
      </div>

      <div className="grid gap-6">
        <Card className="bg-card/40 border-border/50 rounded-2xl">
          <CardHeader>
            <CardTitle>Communication</CardTitle>
            <CardDescription>Primary contact methods for your restaurant.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                      <Phone className="h-3 w-3" /> Phone Number
                   </Label>
                   <Input 
                      value={data.phone} 
                      placeholder="+251 9... or 09..."
                      onChange={e => setData(d => ({ ...d, phone: e.target.value }))}
                      className="bg-background border-border/50 h-12 rounded-xl" 
                   />
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                      <Mail className="h-3 w-3" /> Email Address
                   </Label>
                   <Input 
                      type="email"
                      value={data.email} 
                      placeholder="business@example.com"
                      onChange={e => setData(d => ({ ...d, email: e.target.value }))}
                      className="bg-background border-border/50 h-12 rounded-xl" 
                   />
                </div>
                 <div className="space-y-2 md:col-span-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                     <Globe className="h-3 w-3" /> Website
                   </Label>
                   <Input
                     value={data.website}
                     placeholder="https://restaurant.com"
                     onChange={e => setData(d => ({ ...d, website: e.target.value }))}
                     className="bg-background border-border/50 h-12 rounded-xl"
                   />
                 </div>
             </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/50 rounded-2xl">
          <CardHeader>
            <CardTitle>Physical Address</CardTitle>
            <CardDescription>Help customers locate your restaurant.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                      <Globe className="h-3 w-3" /> City
                   </Label>
                   <Input 
                      value={data.city} 
                      placeholder="e.g. Addis Ababa"
                      onChange={e => setData(d => ({ ...d, city: e.target.value }))}
                      className="bg-background border-border/50 h-12 rounded-xl" 
                   />
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                      <MapPin className="h-3 w-3" /> Country
                   </Label>
                   <Input 
                      value={data.country} 
                     placeholder="e.g. Ethiopia"
                     onChange={e => setData(d => ({ ...d, country: e.target.value }))}
                     className="bg-background border-border/50 h-12 rounded-xl"
                   />
                </div>
             </div>
               <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Timezone</Label>
                 <Input
                   value={data.timezone}
                   placeholder="Africa/Addis_Ababa"
                   onChange={e => setData(d => ({ ...d, timezone: e.target.value }))}
                   className="bg-background border-border/50 h-12 rounded-xl"
                 />
               </div>
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                   Full Address
                </Label>
                <Input 
                   value={data.address} 
                   placeholder="e.g. Bole Road, Near Medhanialem Mall"
                   onChange={e => setData(d => ({ ...d, address: e.target.value }))}
                   className="bg-background border-border/50 h-12 rounded-xl" 
                />
             </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving} className="h-12 px-8 rounded-xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Information
          </Button>
        </div>
      </div>
    </div>
  )
}
