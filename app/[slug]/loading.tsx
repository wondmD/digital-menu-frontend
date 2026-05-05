"use client"

import { Logo } from "@/components/logo"

export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin">
          <Logo width={120} height={120} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground animate-pulse">
          Loading...
        </p>
      </div>
    </div>
  )
}

