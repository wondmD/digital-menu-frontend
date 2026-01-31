"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import { apiFetch } from "@/lib/api-client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Save } from "lucide-react"
import { LoadingSignal } from "@/components/ui/loading-signal"

export default function GeneralInfoPage() {
  const params = useParams()
  const id = params.id as string
  const { data: session } = useSession()
  const token = (session?.user as any)?.accessToken
  const { toast } = useToast()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState({
    name: "",
    description: "",
    cuisine_type: ""
  })

  const load = async () => {
    if (!token || !id) return
    try {
      setLoading(true)
      const res = await apiFetch<any>("/my-restaurants", { token })
      const list = Array.isArray(res) ? res : (res?.data || [])
      const d = list.find((item: any) => item.id === id)
      
      if (d) {
        setData({
          name: d.name || "",
          description: d.description || "",
          cuisine_type: d.cuisine_type || ""
        })
      } else {
        throw new Error("Restaurant not found in your account")
      }
    } catch (err: any) {
      console.error("Fetch error:", err)
      toast({ 
        title: "Error", 
        description: `Failed to load restaurant: ${err.message}`, 
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [token, id])

  const handleSave = async () => {
    try {
      setSaving(true)
      await apiFetch(`/my-restaurants/${id}`, {
        method: "PATCH",
        token,
        body: data // apiFetch will handle JSON.stringify
      })
      toast({ title: "Success", description: "General information updated" })
      await load()
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
        <LoadingSignal />
      </div>
    )
  }

  return (
    <div className="space-y-6 text-foreground">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">General Info</h1>
        <p className="text-muted-foreground font-medium">Basic details about your restaurant.</p>
      </div>

      <Card className="bg-card/40 border-border/50 rounded-2xl">
        <CardHeader>
          <CardTitle>Restaurant Identity</CardTitle>
          <CardDescription>Update your restaurant's name and how it's described.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Restaurant Name</Label>
              <Input 
                value={data.name} 
                onChange={e => setData(d => ({ ...d, name: e.target.value }))}
                className="bg-background border-border/50 h-12 rounded-xl focus:ring-primary/20 shadow-sm" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Cuisine Type</Label>
              <Input 
                value={data.cuisine_type} 
                placeholder="e.g. Italian, Ethiopian, Fast Food"
                onChange={e => setData(d => ({ ...d, cuisine_type: e.target.value }))}
                className="bg-background border-border/50 h-12 rounded-xl focus:ring-primary/20 shadow-sm" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Description</Label>
            <Textarea 
              value={data.description} 
              rows={5}
              onChange={e => setData(d => ({ ...d, description: e.target.value }))}
              className="bg-background border-border/50 rounded-xl focus:ring-primary/20 shadow-sm resize-none" 
              placeholder="Tell your customers what makes your restaurant special..."
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={saving} className="h-12 px-8 rounded-xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">
              {saving ? <LoadingSignal size="sm" className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
