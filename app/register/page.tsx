"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, FormEvent, useEffect } from "react"
import { ChefHat, Sparkles, ArrowLeft, Loader2, Utensils, Smartphone, Mail, User, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/logo"

export default function RegisterPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [errorShake, setErrorShake] = useState(false)
  const [passError, setPassError] = useState<string | null>(null)
  
  // FORM STATE
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: ""
  })

  const triggerShake = () => {
    setErrorShake(true)
    setTimeout(() => setErrorShake(false), 500)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (name === "password") {
      const { message } = validatePassword(value)
      setPassError(message)
    }
  }

  const validateStep1 = () => {
    if (!formData.full_name || !formData.email || !formData.phone) {
      toast({ title: "Incomplete Recipe", description: "Please fill in all details to proceed.", variant: "destructive" })
      triggerShake()
      return false
    }
    if (!formData.email.includes("@")) {
      toast({ title: "Invalid Mail", description: "Please enter a valid work email.", variant: "destructive" })
      triggerShake()
      return false
    }
    return true
  }

  const validatePassword = (pass: string) => {
    if (!pass) return { message: null, isValid: false }
    if (pass.length < 8) return { message: "The dough hasn't proofed long enough (need at least 8 characters).", isValid: false }
    if (!/[A-Z]/.test(pass)) return { message: "Needs more zest! Add at least one uppercase letter for flavor.", isValid: false }
    if (!/[0-9]/.test(pass)) return { message: "A recipe without measurements? Add at least one number.", isValid: false }
    return { message: "Perfectly seasoned! This key is ready for the vault. ✨", isValid: true }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // If user hits Enter on Step 1, move to Step 2
    if (step === 1) {
      if (validateStep1()) {
        setStep(2)
      }
      return
    }

    // Final validation for Step 2
    const { message, isValid } = validatePassword(formData.password)
    if (!isValid) {
      setPassError(message || "Even a ghost kitchen needs a secret key! 👻")
      triggerShake()
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name.trim(),
          role: "owner",
          phone: formData.phone,
        }),
      })

      if (!res.ok) {
        triggerShake()
        const data = await res.json().catch(() => null)
        const message = data?.error || data?.message || "Could not register with those details."
        throw new Error(message)
      }

      toast({ title: "Welcome to the family!", description: "Account created successfully." })
      toast({
        title: "Check your inbox",
        description: "We've sent a luxury invitation (verification link) to your email.",
      })

      router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
    } catch (err: any) {
      triggerShake()
      toast({
        title: "Registration error",
        description: err?.message || "Something went wrong. Please check your details.",
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
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_30%,rgba(230,57,70,0.08),transparent_60%)]" />
        <div className="absolute top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-secondary/10 blur-[150px]" />
        <div className="absolute -bottom-[20%] right-[10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
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
        className="w-full max-w-2xl relative z-10"
      >
        <div className="mb-8 flex items-center justify-between">
          <Link href="/login" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-bold text-xs uppercase tracking-[0.2em] group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Login
          </Link>
          <div className="h-px flex-1 bg-border/50 mx-6" />
          <div className="flex gap-2">
            <div className={cn("h-1.5 w-6 rounded-full transition-all duration-500", step === 1 ? "bg-primary" : "bg-muted")} />
            <div className={cn("h-1.5 w-6 rounded-full transition-all duration-500", step === 2 ? "bg-primary" : "bg-muted")} />
          </div>
        </div>

        <div className="bg-card/40 backdrop-blur-3xl border border-border rounded-[3.5rem] p-8 md:p-14 shadow-2xl">
          <header className="mb-12">
            <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
               <Logo width={160} height={50} />
               <div className="h-10 w-px bg-border hidden md:block" />
               <div>
                  <h1 className="text-3xl md:text-4xl font-serif text-foreground tracking-tight">Claim Your Kitchen 🍽️</h1>
                  <p className="text-muted-foreground font-medium">Join the elite circle of digital restaurant owners.</p>
               </div>
            </div>
          </header>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="relative overflow-hidden min-h-[340px]">
               <AnimatePresence mode="wait">
                  {step === 1 ? (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="group relative">
                        <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground group-focus-within:text-primary transition-colors ml-1 mb-2 block">Executive Name</Label>
                        <div className="relative">
                          <Input 
                            name="full_name" 
                            value={formData.full_name}
                            onChange={handleInputChange}
                            placeholder="Johnathan Silver" 
                            required 
                            className="h-16 rounded-2xl bg-muted/50 border-border focus:border-primary/50 text-foreground pl-14 text-lg transition-all" 
                          />
                          <User className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/30" />
                        </div>
                      </div>

                      <div className="group relative">
                        <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground group-focus-within:text-primary transition-colors ml-1 mb-2 block">Digital Mailbox</Label>
                        <div className="relative">
                          <Input 
                            name="email" 
                            type="email" 
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="manager@establishment.com" 
                            required 
                            className="h-16 rounded-2xl bg-muted/50 border-border focus:border-primary/50 text-foreground pl-14 text-lg transition-all" 
                          />
                          <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/30" />
                        </div>
                      </div>

                      <div className="group relative">
                        <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground group-focus-within:text-primary transition-colors ml-1 mb-2 block">Direct Line</Label>
                        <div className="relative">
                          <Input 
                            name="phone" 
                            type="tel" 
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="+1 (555) 000- luxury" 
                            required 
                            className="h-16 rounded-2xl bg-muted/50 border-border focus:border-primary/50 text-foreground pl-14 text-lg transition-all" 
                          />
                          <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/30" />
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-8">
                         <div className="flex gap-4 items-start">
                            <ShieldCheck className="h-6 w-6 text-primary shrink-0 mt-1" />
                            <p className="text-sm text-foreground leading-relaxed font-medium">Your password must be a secret recipe—unique and complex. It protects your establishment’s digital legacy.</p>
                         </div>
                      </div>

                      <div className="group relative">
                        <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground group-focus-within:text-primary transition-colors ml-1 mb-2 block">Establish the Key (Password)</Label>
                        <Input 
                          name="password" 
                          type="password" 
                          value={formData.password}
                          onChange={handleInputChange}
                          autoFocus
                          required 
                          className={cn(
                            "h-20 rounded-2xl bg-muted/50 border-border focus:border-primary/50 text-foreground px-8 text-2xl tracking-[0.3em] transition-all",
                            passError && !passError.includes("Perfectly") && "border-red-500/50 bg-red-500/5",
                            passError?.includes("Perfectly") && "border-emerald-500/50 bg-emerald-500/5 focus:border-emerald-500/50"
                          )}
                        />
                        <AnimatePresence mode="wait">
                          {passError && (
                            <motion.p
                              key={passError}
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className={cn(
                                "text-xs mt-3 ml-2 font-medium italic flex items-center gap-2",
                                passError.includes("Perfectly") ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                              )}
                            >
                              {passError.includes("Perfectly") ? "✨" : "⚠️"} {passError}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground italic">
                         <div className="h-px flex-1 bg-border" />
                         Finalizing Your Credentials
                         <div className="h-px flex-1 bg-border" />
                      </div>
                    </motion.div>
                  )}
               </AnimatePresence>
            </div>

            <div className="flex gap-4">
              {step > 1 && (
                <Button 
                  type="button" 
                  onClick={() => setStep(step - 1)}
                  variant="outline" 
                  className="h-18 px-8 rounded-2xl border-border text-foreground hover:bg-muted transition-all"
                >
                  Back
                </Button>
              )}
              
              <Button
                type={step === 2 ? "submit" : "button"}
                onClick={() => {
                  if (step === 1) {
                    if (validateStep1()) {
                      setPassError(null);
                      setStep(2);
                    }
                  }
                }}
                disabled={loading}
                className="flex-1 h-18 rounded-2xl bg-primary text-xl font-bold text-white shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all border-none relative overflow-hidden group"
              >
                 <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.div 
                      key="loading" 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      className="flex items-center gap-3"
                    >
                      <Loader2 className="h-6 w-6 animate-spin" />
                      Seasoning your account...
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="text" 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3"
                    >
                      {step === 1 ? "Next Step" : "Ignite Dashboard"}
                      <Sparkles className="h-5 w-5 fill-white group-hover:animate-pulse" />
                    </motion.div>
                  )}
                 </AnimatePresence>
              </Button>
            </div>
          </form>

          <footer className="mt-12 text-center">
             <div className="text-muted-foreground text-sm font-medium">
               Already an elite partner?{" "}
               <Link
                 href="/login"
                 className="text-primary font-black uppercase tracking-widest text-[11px] hover:underline underline-offset-8 transition-all"
               >
                 Sign in to your station
               </Link>
             </div>
          </footer>
        </div>
      </motion.div>
    </div>
  )
}
