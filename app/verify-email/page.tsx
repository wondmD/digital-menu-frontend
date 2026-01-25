"use client"

import { Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { MailCheck, ArrowLeft, LogIn, ChefHat, Sparkles, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Logo } from "@/components/logo"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email")
  const status = searchParams.get("status")

  const isSuccess = status === "success"

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
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-2xl relative z-10"
      >
        <div className="bg-card/40 backdrop-blur-3xl border border-border rounded-[3.5rem] p-8 md:p-14 shadow-[0_60px_120px_-30px_rgba(0,0,0,0.6)] text-center">
          <header className="mb-12 flex flex-col items-center">
            <Logo width={180} height={60} className="mb-12" />
            <motion.div 
              initial={{ rotate: -15, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              className={`mx-auto mb-10 flex h-24 w-24 items-center justify-center rounded-[2rem] border-2 shadow-2xl ${
                isSuccess 
                ? "bg-secondary text-white border-secondary/30 shadow-secondary/20" 
                : "bg-primary text-white border-primary/30 shadow-primary/20"
              }`}
            >
              {isSuccess ? <MailCheck className="h-12 w-12" /> : <Send className="h-10 w-10" />}
            </motion.div>
            
            <h1 className="text-4xl md:text-5xl font-serif text-foreground tracking-tight mb-6">
              {isSuccess ? "Verification Successful!" : "Awaiting Verification"}
            </h1>
            
            <p className="text-muted-foreground text-lg font-medium max-w-md mx-auto leading-relaxed italic">
              {isSuccess ? (
                "Your account has been verified. You can now start managing your digital menu."
              ) : email ? (
                <span>
                  We've sent a verification link to <strong>{email}</strong>. Please follow the instructions to secure your account.
                </span>
              ) : (
                "We've sent a verification link to your inbox. Please follow the instructions to activate your profile."
              )}
            </p>
          </header>

          {!isSuccess && (
            <div className="bg-muted/30 border border-border rounded-3xl p-8 mb-12 text-left space-y-4">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary">In case of delivery delays:</h4>
              <ul className="space-y-3 text-sm text-muted-foreground font-medium">
                <li className="flex items-center gap-3">
                   <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                   Check your spam or junk folder.
                </li>
                <li className="flex items-center gap-3">
                   <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                   Verify the address was typed correctly.
                </li>
                <li className="flex items-center gap-3">
                   <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                   Give the system a moment to deliver.
                </li>
              </ul>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
             {!isSuccess && (
               <Button variant="outline" asChild className="h-16 px-8 rounded-2xl border-border text-foreground hover:bg-muted/30 transition-all text-xs font-black uppercase tracking-widest flex-1">
                 <Link href="/register">
                   <ArrowLeft className="mr-2 h-4 w-4" />
                   Back to Register
                 </Link>
               </Button>
             )}
             <Button asChild className="h-16 px-10 rounded-2xl bg-primary text-white text-lg font-bold shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all border-none flex-1 group">
               <Link href="/login">
                 <LogIn className="mr-3 h-5 w-5" />
                 {isSuccess ? "Enter Dashboard" : "Go to Login"}
                 <Sparkles className="ml-2 h-4 w-4 fill-white group-hover:rotate-12 transition-transform" />
               </Link>
             </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  )
}
