"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Coffee, ArrowLeft, Loader2, Mail, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/components/ui/use-toast"
import { FormEvent, useState } from "react"
import { Logo } from "@/components/logo"
import { apiFetch } from "@/lib/api-client"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorShake, setErrorShake] = useState(false)

  const triggerShake = () => {
    setErrorShake(true)
    setTimeout(() => setErrorShake(false), 500)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string

    setLoading(true)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || "Request failed")
      }
      
      setSubmitted(true)
      toast({ 
        title: "Magic link sent!", 
        description: "Check your inbox for instructions to reset your key." 
      })
    } catch (err: any) {
      triggerShake()
      toast({
        title: "Request failed",
        description: err?.message || "We couldn't send the reset link. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 font-sans relative overflow-hidden selection:bg-primary/30">
      {/* LUXURY BACKGROUND RADIALS */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(230,57,70,0.08),transparent_70%)]" />
        <div className="absolute -top-[10%] -right-[10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[500px] h-[500px] rounded-full bg-secondary/5 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          y: 0,
          x: errorShake ? [0, -10, 10, -10, 10, 0] : 0
        }}
        transition={{ 
          duration: 0.8, 
          ease: [0.22, 1, 0.36, 1],
          x: { duration: 0.4, ease: "easeInOut" }
        }}
        className="w-full max-w-xl relative z-10"
      >
        <div className="mb-8 flex items-center justify-between">
          <Link href="/login" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-bold text-xs uppercase tracking-[0.2em] group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Login
          </Link>
          <div className="h-px flex-1 bg-border mx-6" />
        </div>

        <div className="bg-card/40 backdrop-blur-3xl border border-border rounded-[3rem] p-8 md:p-14 shadow-2xl">
          <header className="mb-12 flex flex-col items-center text-center">
            <Logo width={180} height={60} className="mb-8" />
            <h1 className="text-4xl md:text-5xl font-serif text-foreground tracking-tight mb-4">
              {submitted ? "Check your mail" : "Forgot your key?"}
            </h1>
            <p className="text-muted-foreground text-lg font-medium">
              {submitted 
                ? "We've sent reset instructions to your email address." 
                : "Enter your email and we'll send you a link to reset your password."}
            </p>
          </header>

          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.form 
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8" 
                onSubmit={handleSubmit}
              >
                <div className="group relative">
                  <Label htmlFor="email" className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground group-focus-within:text-primary transition-colors ml-1 mb-3 block">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="headchef@agelgil.com"
                      required
                      className="h-16 rounded-2xl bg-muted/50 border-border focus:border-primary/50 text-foreground pl-6 text-lg transition-all"
                    />
                    <div className="absolute inset-y-0 right-6 flex items-center text-muted-foreground/30 group-focus-within:text-primary/10 transition-colors">
                       <Mail className="h-6 w-6" />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-18 rounded-2xl bg-primary text-xl font-bold text-white shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 border-none group overflow-hidden relative"
                >
                  <AnimatePresence mode="wait">
                    {loading ? (
                      <motion.div 
                        key="loading"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-3"
                      >
                        <Loader2 className="h-6 w-6 animate-spin" />
                        Sending...
                      </motion.div>
                    ) : (
                      <motion.div
                        key="idle"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        Send Reset Link
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.form>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center py-8"
              >
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-8">
                  <CheckCircle2 className="h-12 w-12 text-primary" />
                </div>
                <p className="text-muted-foreground mb-8">
                  Didn't receive the email? Check your spam folder or try again in a few minutes.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setSubmitted(false)}
                  className="rounded-xl h-14 px-8 border-primary/20 text-primary hover:bg-primary/5"
                >
                  Try a different email
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
