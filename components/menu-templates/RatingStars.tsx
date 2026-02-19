"use client"

import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface RatingStarsProps {
  rating: number
  count?: number
  onRate?: (value: number) => void
  sizeClassName?: string
  className?: string
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export default function RatingStars({
  rating,
  count = 0,
  onRate,
  sizeClassName = "h-4 w-4",
  className,
}: RatingStarsProps) {
  const safeRating = clamp(rating, 0, 5)

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, index) => {
          const fill = clamp(safeRating - index, 0, 1)
          const fillPercent = `${Math.round(fill * 100)}%`

          return (
            <button
              key={index}
              type="button"
              aria-label={`Rate ${index + 1} star`}
              className="relative focus:outline-none"
              onClick={(event) => {
                if (!onRate) return
                event.preventDefault()
                event.stopPropagation()

                const rect = event.currentTarget.getBoundingClientRect()
                const offset = event.clientX - rect.left
                const value = offset < rect.width / 2 ? index + 0.5 : index + 1
                onRate(value)
              }}
            >
              <Star className={cn("text-muted-foreground/40", sizeClassName)} />
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: fillPercent }}
              >
                <Star className={cn("text-primary fill-primary", sizeClassName)} />
              </span>
            </button>
          )
        })}
      </div>
      <span className="text-[11px] font-semibold text-muted-foreground">
        {count > 0 ? `${safeRating.toFixed(1)} (${count})` : "New"}
      </span>
    </div>
  )
}
