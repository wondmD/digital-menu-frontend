"use client"

import { Suspense, useState, FormEvent, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, ArrowLeft, Loader2, ShieldCheck, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/components/ui/use-toast"
import { Logo } from "@/components/logo"
import { apiFetch } from "@/lib/api-client"

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const token = searchParams.get("token")
  
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errorShake, setErrorShake] = useState(false)
  const [passError, setPassError] = useState<string | null>(null)
  
  const [passwords, setPasswords] = useState({
    password: "",
    confirm: ""
  })

  useEffect(() => {
    if (!token && !success) {
      toast({
        title: "Invalid Link",
        description: "The reset link is missing its secret key. Please request a new one.",
        variant: "destructive"
      })
    }
  }, [token, toast, success])

  const triggerShake = () => {
    setErrorShake(true)
    setTimeout(() => setErrorShake(false), 500)
  }

  const validatePassword = (pass: string) => {
    if (!pass) return { message: null, isValid: false }
    if (pass.length < 8) return { message: "The key must be at least 8 characters long.", isValid: false }
    if (!/[A-Z]/.test(pass)) return { message: "Add an uppercase letter for security.", isValid: false }
    if (!/[0-9]/.test(pass)) return { message: "Add at least one number.", isValid: false }
    return { message: "Strong key! 🔒", isValid: true }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setPasswords(prev => ({ ...prev, password: val }))
    const { message } = validatePassword(val)
    setPassError(message)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!token) {
      toast({ title: "Error", description: "Missing reset token.", variant: "destructive" })
      return
    }

    if (passwords.password !== passwords.confirm) {
      toast({ title: "Mismatched Keys", description: "The passwords do not match.", variant: "destructive" })
      triggerShake()
      return
    }

    const { isValid } = validatePassword(passwords.password)
    if (!isValid) {
      triggerShake()
      return
    }

    console.log("[ResetPassword] Submitting with token:", token)

    setLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: passwords.password }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || "Reset failed")
      }
      
      setSuccess(true)
      toast({ title: "Key Updated!", description: "Your secret key has been successfully changed." })
    } catch (err: any) {
      triggerShake()
      toast({
        title: "Reset failed",
        description: err?.message || "We couldn't update your password. The link might be expired.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card/40 backdrop-blur-3xl border border-border rounded-[3rem] p-8 md:p-14 shadow-2xl">
      <header className="mb-12 flex flex-col items-center text-center">
        <Logo width={180} height={60} className="mb-8" />
        <h1 className="text-4xl md:text-5xl font-serif text-foreground tracking-tight mb-4">
          {success ? "Success!" : "Reset your key"}
        </h1>
        <p className="text-muted-foreground text-lg font-medium">
          {success 
            ? "Your vault is secure with a new key." 
            : "Choose a new secret key to access your account."}
        </p>
      </header>

      <AnimatePresence mode="wait">
        {!success ? (
          <motion.form 
            key="reset-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8" 
            onSubmit={handleSubmit}
          >
            <div className="space-y-6">
              <div className="group relative">
                <div className="flex items-center justify-between mb-3 px-1">
                  <Label htmlFor="password" className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground group-focus-within:text-primary transition-colors">
                    New Secret Key
                  </Label>
                  {passError && (
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${passError.includes("Perfect") || passError.includes("Strong") ? "text-secondary" : "text-primary"}`}>
                      {passError}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={passwords.password}
                    onChange={handlePasswordChange}
                    required
                    className="h-16 rounded-2xl bg-muted/50 border-border focus:border-primary/50 text-foreground pl-6 pr-14 text-lg transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-5 flex items-center text-muted-foreground hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                  </button>
                </div>
              </div>

              <div className="group relative">
                <Label htmlFor="confirm" className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground group-focus-within:text-primary transition-colors ml-1 mb-3 block">
                  Re-type Secret Key
                </Label>
                <div className="relative">
                  <Input
                    id="confirm"
                    type={showPassword ? "text" : "password"}
                    value={passwords.confirm}
                    onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                    required
                    className="h-16 rounded-2xl bg-muted/50 border-border focus:border-primary/50 text-foreground pl-6 pr-14 text-lg transition-all"
                  />
                  <div className="absolute inset-y-0 right-6 flex items-center text-muted-foreground/30 group-focus-within:text-primary/10 transition-colors">
                     <ShieldCheck className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !token}
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
                    Updating...
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {token ? "Update Secret Key" : "Missing Token"}
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </motion.form>
        ) : (
          <motion.div
            key="success-state"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center py-8"
          >
            <div className="h-24 w-24 rounded-full bg-secondary/10 flex items-center justify-center mb-8">
              <CheckCircle2 className="h-12 w-12 text-secondary" />
            </div>
            <p className="text-muted-foreground mb-10 text-lg">
              You've successfully reset your password. You can now log in with your new credentials.
            </p>
            <Button
              asChild
              className="w-full h-16 rounded-2xl bg-primary text-lg font-bold text-white shadow-2xl shadow-primary/30 hover:scale-[1.02] transition-all"
            >
              <Link href="/login">Go to Login</Link>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 font-sans relative overflow-hidden selection:bg-primary/30">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(230,57,70,0.08),transparent_70%)]" />
        <div className="absolute -top-[10%] -right-[10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[500px] h-[500px] rounded-full bg-secondary/5 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-xl relative z-10"
      >
        <div className="mb-8 flex items-center justify-between">
          <Link href="/login" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-bold text-xs uppercase tracking-[0.2em] group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Login
          </Link>
          <div className="h-px flex-1 bg-border mx-6" />
        </div>

        <Suspense fallback={
          <div className="bg-card/40 backdrop-blur-3xl border border-border rounded-[3rem] p-14 flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </motion.div>
    </div>
  )
}
