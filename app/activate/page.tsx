"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { apiFetch } from "@/lib/api-client"

function ActivateContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setMessage("No activation token provided.")
      return
    }

    const activateAccount = async () => {
      try {
        // According to the Postman collection, the endpoint is /auth/activate?token={{activation_token}}
        const response = await apiFetch<any>(`/auth/activate?token=${token}`)
        
        // Success often comes back with a success message or the user object
        setStatus("success")
        setMessage(response?.message || "Your account has been successfully activated. You can now log in to manage your menu.")
      } catch (err: any) {
        setStatus("error")
        setMessage(err?.message || "The activation link is invalid or has expired.")
      }
    }

    activateAccount()
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4 font-sans">
      <Card className="w-full max-w-lg bg-white/80 backdrop-blur-md border-primary/10 shadow-xl overflow-hidden">
        <div className="h-2 w-full bg-primary/20">
          {status === "loading" && <div className="h-full bg-primary animate-progress-flow" style={{ width: "40%" }} />}
          {status === "success" && <div className="h-full bg-green-500" style={{ width: "100%" }} />}
          {status === "error" && <div className="h-full bg-destructive" style={{ width: "100%" }} />}
        </div>
        
        <CardHeader className="text-center space-y-3 pt-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-white shadow-lg bg-white">
            {status === "loading" && <Loader2 className="h-10 w-10 text-primary animate-spin" />}
            {status === "success" && <CheckCircle2 className="h-10 w-10 text-green-500" />}
            {status === "error" && <XCircle className="h-10 w-10 text-destructive" />}
          </div>
          
          <CardTitle className="text-3xl font-serif text-foreground pt-4">
            {status === "loading" && "Validating token..."}
            {status === "success" && "Account Activated!"}
            {status === "error" && "Activation Failed"}
          </CardTitle>
          
          <CardDescription className="text-base text-muted-foreground px-6">
            {message || (status === "loading" && "Please wait while we verify your activation link.")}
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center pb-8 pt-4">
          {status === "success" && (
            <p className="text-sm font-medium text-green-600/80 bg-green-50 py-3 px-4 rounded-xl inline-block border border-green-100 italic">
              "A fresh start begins with a single click."
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
              <Link href="/login" className="flex items-center justify-center gap-2">
                Continue to Login
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          ) : (
            <>
              <Button variant="outline" asChild className="w-full rounded-2xl h-12 text-sm font-bold uppercase tracking-wider border-2">
                <Link href="/register">Sign Up Again</Link>
              </Button>
              <Button asChild className="w-full rounded-2xl h-12 text-sm font-bold uppercase tracking-wider shadow-lg shadow-primary/20">
                <Link href="/login">Contact Support</Link>
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
      
      <style jsx>{`
        @keyframes progress-flow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        .animate-progress-flow {
          animation: progress-flow 2s infinite linear;
        }
      `}</style>
    </div>
  )
}

export default function ActivatePage() {
  return (
    <Suspense>
      <ActivateContent />
    </Suspense>
  )
}
