"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { apiFetch } from "@/lib/api-client"
import { Logo } from "@/components/logo"

interface PartnerInvitation {
  email: string
  full_name: string
  role: string
  referral_code: string
  level: string
  payout_account: string
  expires_in: number
}

function ActivateContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")
  
  const [status, setStatus] = useState<"loading" | "verify" | "setup" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const [invitation, setInvitation] = useState<PartnerInvitation | null>(null)
  const [formData, setFormData] = useState({ password: "", fullName: "" })

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setMessage("No activation token provided.")
      return
    }

    const verifyToken = async () => {
      try {
        // Verify the partner invitation token
        const response = await apiFetch<any>("/auth/partner-invitations/verify", {
          method: "POST",
          body: JSON.stringify({ token }),
        })
        
        // Handle the response data based on API envelope
        const inviteData = response?.data || response
        setInvitation(inviteData)
        setFormData(prev => ({ ...prev, fullName: inviteData?.full_name || "" }))
        setStatus("setup")
      } catch (err: any) {
        setStatus("error")
        // Provide more specific error messages
        if (err?.code === "INVALID_TOKEN" || err?.statusCode === 400) {
          setMessage("This invitation link is invalid or has expired. Please contact the admin for a new invitation link.")
        } else if (err?.message?.includes("404")) {
          setMessage("This token does not correspond to a partner invitation. Please ensure you're using the correct partner activation link.")
        } else {
          setMessage(err?.message || "The activation link is invalid or has expired.")
        }
      }
    }

    verifyToken()
  }, [token])

  const handleAcceptInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.password || !formData.fullName) {
      setMessage("Please fill in all required fields.")
      return
    }

    if (formData.password.length < 8) {
      setMessage("Password must be at least 8 characters long.")
      return
    }

    setStatus("loading")
    
    try {
      // Accept the partner invitation and set password
      const response = await apiFetch<any>("/auth/partner-invitations/accept", {
        method: "POST",
        body: JSON.stringify({
          token,
          password: formData.password,
          full_name: formData.fullName,
        }),
      })
      
      setStatus("success")
      setMessage("Your partner account has been successfully activated. Redirecting to login...")
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/partner/login")
      }, 2000)
    } catch (err: any) {
      setStatus("setup")
      setMessage(err?.message || "Failed to accept invitation. Please try again.")
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-secondary/30 p-4 font-sans gap-8">
      <Logo width={180} height={60} />
      <Card className="w-full max-w-lg bg-white/80 backdrop-blur-md border-primary/10 shadow-xl overflow-hidden">
        <div className="h-2 w-full bg-primary/20">
          {status === "loading" && <div className="h-full bg-primary animate-progress-flow" style={{ width: "40%" }} />}
          {status === "verify" && <div className="h-full bg-blue-500 animate-progress-flow" style={{ width: "60%" }} />}
          {status === "setup" && <div className="h-full bg-blue-500 animate-progress-flow" style={{ width: "80%" }} />}
          {status === "success" && <div className="h-full bg-green-500" style={{ width: "100%" }} />}
          {status === "error" && <div className="h-full bg-destructive" style={{ width: "100%" }} />}
        </div>
        
        <CardHeader className="text-center space-y-3 pt-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-white shadow-lg bg-white">
            {(status === "loading" || status === "verify" || status === "setup") && <Loader2 className="h-10 w-10 text-primary animate-spin" />}
            {status === "success" && <CheckCircle2 className="h-10 w-10 text-green-500" />}
            {status === "error" && <XCircle className="h-10 w-10 text-destructive" />}
          </div>
          
          <CardTitle className="text-3xl font-serif text-foreground pt-4">
            {status === "loading" && "Validating token..."}
            {status === "verify" && "Verifying Invitation"}
            {status === "setup" && "Complete Your Profile"}
            {status === "success" && "Partner Account Activated!"}
            {status === "error" && "Activation Failed"}
          </CardTitle>
          
          <CardDescription className="text-base text-muted-foreground px-6">
            {message || (status === "loading" && "Please wait while we verify your activation link.")}
            {status === "setup" && invitation && `Welcome, ${invitation.full_name}! Set your password to activate your partner account.`}
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center pb-8 pt-4">
          {status === "setup" && invitation && (
            <form onSubmit={handleAcceptInvitation} className="space-y-4">
              <div className="text-left space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Your full name"
                  required
                />
              </div>
              <div className="text-left space-y-2">
                <label className="text-sm font-medium">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Min 8 characters"
                  minLength={8}
                  required
                />
              </div>
              {message && status === "setup" && (
                <p className="text-sm text-destructive bg-destructive/10 py-2 px-3 rounded">{message}</p>
              )}
              <Button type="submit" className="w-full rounded-2xl h-12 text-sm font-bold uppercase tracking-wider">
                Activate Account
              </Button>
            </form>
          )}
          {status === "success" && (
            <p className="text-sm font-medium text-green-600/80 bg-green-50 py-3 px-4 rounded-xl inline-block border border-green-100 italic">
              "Welcome to the MenuVista partner network!"
            </p>
          )}
          {status === "error" && (
            <div className="space-y-4">
               <p className="text-sm text-balance">If you think this is an error, try requesting a new link or contact support.</p>
            </div>
          )}
        </CardContent>

        <CardFooter className="bg-muted/30 p-6 flex flex-col sm:flex-row gap-3">
          {status === "success" ? (
            <Button asChild className="w-full group rounded-2xl h-12 text-sm font-bold uppercase tracking-wider">
              <Link href="/partner/login" className="flex items-center justify-center gap-2">
                Continue to Partner Login
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          ) : status !== "setup" && (
            <>
              <Button variant="outline" asChild className="w-full rounded-2xl h-12 text-sm font-bold uppercase tracking-wider border-2">
                <Link href="/partner/login">Contact Support</Link>
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

export default function ActivatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-secondary/30 p-4 font-sans gap-8">
        <Logo width={180} height={60} />
        <Card className="w-full max-w-lg bg-white/80 backdrop-blur-md border-primary/10 shadow-xl">
          <CardContent className="py-8">
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <ActivateContent />
    </Suspense>
  )
}
