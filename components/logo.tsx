"use client"

import Image from "next/image"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  width?: number
  height?: number
  grayscale?: boolean
}

export function Logo({ className, width = 120, height = 40, grayscale = false }: LogoProps) {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className={cn("bg-muted animate-pulse rounded", className)} style={{ width, height }} />
  }

  const currentTheme = resolvedTheme || theme
  const src = currentTheme === "dark" ? "/logo_light.png" : "/logo_dark.png"

  return (
    <div 
      className={cn("relative flex items-center overflow-hidden", grayscale && "grayscale opacity-50 contrast-125", className)}
      style={{ width: width, height: height }}
    >
      <Image
        src={src}
        alt="Agelgil Logo"
        fill
        className="object-cover object-left"
        priority
      />
    </div>
  )
}
