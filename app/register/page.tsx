"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState, FormEvent, useEffect } from "react"
import { ChefHat, Sparkles, ArrowLeft, Loader2, Utensils, Smartphone, Mail, User, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/logo"

const ETHIOPIA_DIAL_CODE = "+251"

function RegisterForm() {
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [errorShake, setErrorShake] = useState(false)
  const [passError, setPassError] = useState<string | null>(null)
  const [confirmPassError, setConfirmPassError] = useState<string | null>(null)
  const [step2SubmitAttempted, setStep2SubmitAttempted] = useState(false)
  const [touched, setTouched] = useState({
    email: false,
    phone: false,
    password: false,
    confirm_password: false,
  })
  
  // FORM STATE
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    marketer_referral_code: "",
  })

  useEffect(() => {
    const fromUrl =
      searchParams.get("marketer_referral_code") ||
      searchParams.get("referral_code") ||
      searchParams.get("ref") ||
      ""

    if (!fromUrl) return
    setFormData((prev) => ({
      ...prev,
      marketer_referral_code: prev.marketer_referral_code || fromUrl,
    }))
  }, [searchParams])

  const triggerShake = () => {
    setErrorShake(true)
    setTimeout(() => setErrorShake(false), 500)
  }

  const validateEmail = (email: string) => {
    if (!email.trim()) {
      return { isValid: false, message: "Email is required." }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i
    if (!emailRegex.test(email.trim())) {
      return { isValid: false, message: "Enter a valid email address." }
    }

    return { isValid: true, message: "Email looks good." }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (name === "phone") {
      const cleaned = value.replace(/\D/g, "")
      setFormData((prev) => ({ ...prev, phone: cleaned }))
      return
    }

    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (name === "password") {
      setTouched((prev) => ({ ...prev, password: true }))
      const { message } = validatePassword(value)
      setPassError(message)
      const confirmValidation = validatePasswordConfirmation(value, formData.confirm_password)
      setConfirmPassError(confirmValidation.message)
    }

    if (name === "confirm_password") {
      setTouched((prev) => ({ ...prev, confirm_password: true }))
      const confirmValidation = validatePasswordConfirmation(formData.password, value)
      setConfirmPassError(confirmValidation.message)
    }
  }

  const validateStep1 = () => {
    if (!formData.full_name || !formData.email || !formData.phone) {
      toast({ title: "Incomplete Recipe", description: "Please fill in all details to proceed.", variant: "destructive" })
      triggerShake()
      return false
    }

    const emailValidation = validateEmail(formData.email)
    if (!emailValidation.isValid) {
      toast({ title: "Invalid Mail", description: emailValidation.message, variant: "destructive" })
      triggerShake()
      return false
    }

    const normalizedPhone = normalizeEthiopianPhone(formData.phone)
    if (!normalizedPhone) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid Ethiopian number (e.g. +251912345678 or 0912345678).",
        variant: "destructive",
      })
      triggerShake()
      return false
    }

    setFormData((prev) => ({ ...prev, phone: normalizedPhone }))

    return true
  }

  const validatePassword = (pass: string) => {
    if (!pass) return { message: null, isValid: false }
    if (pass.length < 8) return { message: "The dough hasn't proofed long enough (need at least 8 characters).", isValid: false }
    if (!/[A-Z]/.test(pass)) return { message: "Needs more zest! Add at least one uppercase letter for flavor.", isValid: false }
    if (!/[0-9]/.test(pass)) return { message: "A recipe without measurements? Add at least one number.", isValid: false }
    return { message: "Perfectly seasoned! This key is ready for the vault. ✨", isValid: true }
  }

  const validatePasswordConfirmation = (password: string, confirmation: string) => {
    if (!confirmation) return { message: null, isValid: false }
    if (password !== confirmation) {
      return { message: "Passwords do not match yet.", isValid: false }
    }
    return { message: "Passwords match.", isValid: true }
  }

  const normalizeEthiopianPhone = (rawPhone: string): string | null => {
    const compact = rawPhone.replace(/\D/g, "")

    if (/^0[79]\d{8}$/.test(compact)) {
      return `+251${compact.slice(1)}`
    }

    if (/^[79]\d{8}$/.test(compact)) {
      return `+251${compact}`
    }

    return null
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // If user hits Enter on Step 1, move to Step 2
    if (step === 1) {
      if (validateStep1()) {
        setPassError(null)
        setStep(2)
      }
      return
    }

    // Final validation for Step 2
    setStep2SubmitAttempted(true)
    const { message, isValid } = validatePassword(formData.password)
    if (!isValid) {
      setPassError(message || "Even a ghost kitchen needs a secret key! 👻")
      triggerShake()
      return
    }

    const confirmPasswordValidation = validatePasswordConfirmation(formData.password, formData.confirm_password)
    if (!confirmPasswordValidation.isValid) {
      setConfirmPassError(confirmPasswordValidation.message || "Please confirm your password.")
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
          ...(formData.marketer_referral_code.trim()
            ? { marketer_referral_code: formData.marketer_referral_code.trim() }
            : {}),
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

  const emailValidation = validateEmail(formData.email)
  const phoneIsValid = !!normalizeEthiopianPhone(formData.phone)

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
          <header className="mb-12 text-center">
            <div className="mx-auto mb-8 w-fit">
              <Logo width={220} height={72} />
            </div>
            <h1 className="text-3xl md:text-4xl font-serif text-foreground tracking-tight">Claim Your Kitchen 🍽️</h1>
            <p className="mt-2 text-muted-foreground font-medium">Join the elite circle of digital restaurant owners.</p>
          </header>

          <form onSubmit={handleSubmit} noValidate className="space-y-8">
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
                            placeholder="Abebe Kebede" 
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
                            onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                            placeholder="manager@addiskitchen.et" 
                            required 
                            className={cn(
                              "h-16 rounded-2xl bg-muted/50 border-border focus:border-primary/50 text-foreground pl-14 text-lg transition-all",
                              touched.email && !emailValidation.isValid && "border-red-500/50 bg-red-500/5",
                              touched.email && emailValidation.isValid && "border-emerald-500/50 bg-emerald-500/5"
                            )}
                          />
                          <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/30" />
                        </div>
                        {touched.email && (
                          <p
                            className={cn(
                              "text-xs mt-2 ml-2 font-medium",
                              emailValidation.isValid ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                            )}
                          >
                            {emailValidation.message}
                          </p>
                        )}
                      </div>

                      <div className="group relative">
                        <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground group-focus-within:text-primary transition-colors ml-1 mb-2 block">Direct Line</Label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex items-center gap-2 rounded-xl border border-border bg-background/90 px-3 py-2 text-sm font-semibold text-foreground">
                            <span aria-hidden="true">🇪🇹</span>
                            <span>{ETHIOPIA_DIAL_CODE}</span>
                          </div>
                          <Input 
                            name="phone" 
                            type="tel" 
                            value={formData.phone}
                            onChange={handleInputChange}
                            onBlur={() => setTouched((prev) => ({ ...prev, phone: true }))}
                            placeholder="912345678" 
                            inputMode="tel"
                            autoComplete="tel-national"
                            maxLength={10}
                            className={cn(
                              "h-16 rounded-2xl bg-muted/50 border-border focus:border-primary/50 text-foreground pl-36 text-lg transition-all",
                              touched.phone && !phoneIsValid && "border-red-500/50 bg-red-500/5",
                              touched.phone && phoneIsValid && "border-emerald-500/50 bg-emerald-500/5"
                            )}
                          />
                          <Smartphone className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/30" />
                        </div>
                        {touched.phone && (
                          <p
                            className={cn(
                              "text-xs mt-2 ml-2 font-medium",
                              phoneIsValid ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                            )}
                          >
                            {phoneIsValid
                              ? "Valid Ethiopian phone number."
                              : "Enter 9XXXXXXXX, 7XXXXXXXX, 09XXXXXXXX, or 07XXXXXXXX."}
                          </p>
                        )}
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
                          onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                          className={cn(
                            "h-20 rounded-2xl bg-muted/50 border-border focus:border-primary/50 text-foreground px-8 text-2xl tracking-[0.3em] transition-all",
                            (step2SubmitAttempted || touched.password) && passError && !passError.includes("Perfectly") && "border-red-500/50 bg-red-500/5",
                            (step2SubmitAttempted || touched.password) && passError?.includes("Perfectly") && "border-emerald-500/50 bg-emerald-500/5 focus:border-emerald-500/50"
                          )}
                        />
                        <AnimatePresence mode="wait">
                          {(step2SubmitAttempted || touched.password) && passError && (
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

                      <div className="group relative">
                        <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground group-focus-within:text-primary transition-colors ml-1 mb-2 block">Confirm Key (Repeat Password)</Label>
                        <Input
                          name="confirm_password"
                          type="password"
                          value={formData.confirm_password}
                          onChange={handleInputChange}
                          onBlur={() => setTouched((prev) => ({ ...prev, confirm_password: true }))}
                          className={cn(
                            "h-16 rounded-2xl bg-muted/50 border-border focus:border-primary/50 text-foreground px-8 text-xl tracking-[0.2em] transition-all",
                            (step2SubmitAttempted || touched.confirm_password) && confirmPassError && !confirmPassError.includes("match.") && "border-red-500/50 bg-red-500/5",
                            (step2SubmitAttempted || touched.confirm_password) && confirmPassError?.includes("match.") && "border-emerald-500/50 bg-emerald-500/5 focus:border-emerald-500/50"
                          )}
                        />
                        <AnimatePresence mode="wait">
                          {(step2SubmitAttempted || touched.confirm_password) && confirmPassError && (
                            <motion.p
                              key={confirmPassError}
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className={cn(
                                "text-xs mt-3 ml-2 font-medium italic flex items-center gap-2",
                                confirmPassError.includes("match.") ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                              )}
                            >
                              {confirmPassError.includes("match.") ? "✨" : "⚠️"} {confirmPassError}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="group relative">
                        <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground group-focus-within:text-primary transition-colors ml-1 mb-2 block">
                          Referral Code (Optional)
                        </Label>
                        <Input
                          name="marketer_referral_code"
                          type="text"
                          value={formData.marketer_referral_code}
                          onChange={handleInputChange}
                          placeholder="e.g. MKT001"
                          className="h-14 rounded-2xl bg-muted/50 border-border focus:border-primary/50 text-foreground px-6 text-sm tracking-[0.08em] uppercase transition-all"
                        />
                        <p className="mt-2 ml-2 text-xs text-muted-foreground">
                          If this restaurant was referred by a partner, enter their code to apply attribution.
                        </p>
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

            <div className="sticky bottom-0 z-20 -mx-2 px-2 py-3 bg-card/85 backdrop-blur rounded-2xl flex flex-col sm:flex-row gap-3">
              {step > 1 && (
                <Button 
                  type="button" 
                  onClick={() => {
                    setStep(step - 1)
                    setStep2SubmitAttempted(false)
                    setPassError(null)
                    setConfirmPassError(null)
                    setTouched((prev) => ({ ...prev, password: false, confirm_password: false }))
                  }}
                  variant="outline" 
                  className="w-full sm:w-auto h-14 sm:h-16 px-8 rounded-2xl border-border text-foreground hover:bg-muted transition-all"
                >
                  Back
                </Button>
              )}
              
              {step === 1 ? (
                <Button
                  type="button"
                  onClick={() => {
                    if (validateStep1()) {
                      setPassError(null)
                      setConfirmPassError(null)
                      setStep2SubmitAttempted(false)
                      setTouched((prev) => ({ ...prev, password: false, confirm_password: false }))
                      setStep(2)
                    }
                  }}
                  disabled={loading}
                  className="w-full flex-1 h-14 sm:h-16 rounded-2xl bg-primary text-base sm:text-xl font-bold text-white shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all border-none relative overflow-hidden group touch-manipulation"
                >
                  <motion.div
                    key="next-text"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3"
                  >
                    Next Step
                    <Sparkles className="h-5 w-5 fill-white group-hover:animate-pulse" />
                  </motion.div>
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full flex-1 h-14 sm:h-16 rounded-2xl bg-primary text-base sm:text-xl font-bold text-white shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all border-none relative overflow-hidden group touch-manipulation"
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
                        key="submit-text"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3"
                      >
                        Ignite Dashboard
                        <Sparkles className="h-5 w-5 fill-white group-hover:animate-pulse" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              )}
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

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading registration...
          </div>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  )
}
