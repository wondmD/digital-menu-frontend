"use client"

import { motion } from "framer-motion"
import { Loader2, Utensils } from "lucide-react"
import { cn } from "@/lib/utils"

export function LoadingSignal({ 
  message = "Loading...", 
  size = "md",
  className
}: { 
  message?: string; 
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  if (size === "sm") {
    return (
      <div className={cn("relative flex items-center justify-center", className)}>
        <Loader2 className="h-full w-full animate-spin text-primary" />
        <Utensils className="h-[50%] w-[50%] text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-6", className)}>
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
        <Loader2 className={cn(
          "animate-spin text-primary relative z-10",
          size === "lg" ? "h-24 w-24" : "h-16 w-16"
        )} />
        <Utensils className={cn(
          "text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10",
          size === "lg" ? "h-12 w-12" : "h-8 w-8"
        )} />
      </div>
      {message && (
        <p className={cn(
          "font-serif text-foreground/80 tracking-widest animate-pulse uppercase",
          size === "lg" ? "text-2xl" : "text-xl"
        )}>
          {message}
        </p>
      )}
    </div>
  )
}
