"use client"

import { Logo } from "@/components/logo"

export default function Loading() {
  const points = Array.from({ length: 8 })

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex h-40 w-40 items-center justify-center">
          <div className="absolute inset-0 animate-spin">
            {points.map((_, index) => (
              <span
                key={index}
                className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
                style={{
                  transform: `translate(-50%, -50%) rotate(${index * 45}deg) translateY(-68px)`,
                  opacity: 0.32 + index * 0.08,
                }}
              />
            ))}
          </div>

          <div className="relative z-10">
            <Logo width={120} height={120} />
          </div>
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground animate-pulse">
          Loading...
        </p>
      </div>
    </div>
  )
}

