"use client"

import { CSSProperties, ReactNode } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Logo } from "@/components/logo"
import { cn, getImageUrl, getImageUrls } from "@/lib/utils"
import type { Category, MenuItem, TemplateTheme } from "./types"
import { ArrowRight, BellRing, Coffee, CupSoda, Flame, Hotel, KeyRound, Sparkles, Star, UtensilsCrossed } from "lucide-react"

export type MenuTemplateVariant = "cafe" | "restaurant" | "hotel"

export type ResolvedTemplateTheme = Required<TemplateTheme> & {
  backgroundColor: string
  surfaceColor: string
  mutedSurfaceColor: string
  borderColor: string
  textColor: string
  mutedTextColor: string
  accentColor: string
  shadowColor: string
  fontFamily: string
}

type TemplateThemeInput = TemplateTheme & {
  backgroundColor?: string
  surfaceColor?: string
  mutedSurfaceColor?: string
  borderColor?: string
  textColor?: string
  mutedTextColor?: string
  accentColor?: string
  shadowColor?: string
}

const DEFAULT_THEMES: Record<MenuTemplateVariant, ResolvedTemplateTheme> = {
  cafe: {
    primaryColor: "#8A5A3C",
    secondaryColor: "#D8C2A4",
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
    backgroundColor: "#F6EFE5",
    surfaceColor: "rgba(255, 251, 245, 0.92)",
    mutedSurfaceColor: "rgba(248, 240, 229, 0.9)",
    borderColor: "rgba(138, 90, 60, 0.16)",
    textColor: "#1D1714",
    mutedTextColor: "#6E5A4C",
    accentColor: "#E9D8C1",
    shadowColor: "rgba(100, 67, 45, 0.12)",
  },
  restaurant: {
    primaryColor: "#D9B46F",
    secondaryColor: "#8D5A3C",
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
    backgroundColor: "#0C0B0B",
    surfaceColor: "rgba(24, 20, 19, 0.9)",
    mutedSurfaceColor: "rgba(34, 28, 26, 0.92)",
    borderColor: "rgba(217, 180, 111, 0.18)",
    textColor: "#F6EFE5",
    mutedTextColor: "#B8A998",
    accentColor: "#2C2220",
    shadowColor: "rgba(0, 0, 0, 0.35)",
  },
  hotel: {
    primaryColor: "#8C6A38",
    secondaryColor: "#C4A46B",
    fontFamily: "Georgia, Cambria, 'Times New Roman', Times, serif",
    backgroundColor: "#F7F4EE",
    surfaceColor: "rgba(255, 255, 255, 0.96)",
    mutedSurfaceColor: "rgba(246, 242, 234, 0.95)",
    borderColor: "rgba(140, 106, 56, 0.16)",
    textColor: "#1E1813",
    mutedTextColor: "#76695D",
    accentColor: "#EEE4D0",
    shadowColor: "rgba(84, 62, 33, 0.10)",
  },
}

export function resolveTemplateTheme(variant: MenuTemplateVariant, theme?: TemplateThemeInput): ResolvedTemplateTheme {
  const defaults = DEFAULT_THEMES[variant]

  return {
    primaryColor: theme?.primaryColor || defaults.primaryColor,
    secondaryColor: theme?.secondaryColor || defaults.secondaryColor,
    fontFamily: theme?.fontFamily || defaults.fontFamily,
    backgroundColor: theme?.backgroundColor || defaults.backgroundColor,
    surfaceColor: theme?.surfaceColor || defaults.surfaceColor,
    mutedSurfaceColor: theme?.mutedSurfaceColor || defaults.mutedSurfaceColor,
    borderColor: theme?.borderColor || defaults.borderColor,
    textColor: theme?.textColor || defaults.textColor,
    mutedTextColor: theme?.mutedTextColor || defaults.mutedTextColor,
    accentColor: theme?.accentColor || defaults.accentColor,
    shadowColor: theme?.shadowColor || defaults.shadowColor,
  }
}

function getReadableTextColor(hexColor: string, lightColor = "#FFFFFF", darkColor = "#111111") {
  const match = String(hexColor || "").replace("#", "")
  if (match.length !== 6) return lightColor

  const r = Number.parseInt(match.slice(0, 2), 16)
  const g = Number.parseInt(match.slice(2, 4), 16)
  const b = Number.parseInt(match.slice(4, 6), 16)
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255

  return luminance > 0.62 ? darkColor : lightColor
}

export function templateStyle(theme: ResolvedTemplateTheme): CSSProperties {
  return {
    backgroundColor: theme.backgroundColor,
    color: theme.textColor,
    fontFamily: theme.fontFamily,
    ["--menu-primary" as any]: theme.primaryColor,
    ["--menu-secondary" as any]: theme.secondaryColor,
    ["--menu-surface" as any]: theme.surfaceColor,
    ["--menu-muted-surface" as any]: theme.mutedSurfaceColor,
    ["--menu-border" as any]: theme.borderColor,
    ["--menu-muted" as any]: theme.mutedTextColor,
    ["--menu-accent" as any]: theme.accentColor,
    ["--menu-shadow" as any]: theme.shadowColor,
  } as CSSProperties
}

export function getCategorySectionId(categoryId: string) {
  return `category-${categoryId}`
}

export function getMenuImageSource(item: MenuItem): string {
  return (
    getImageUrl(item.image_url || item.image || item.images || item.image_urls) ||
    getImageUrls(item.image_url || item.image || item.images || item.image_urls)[0] ||
    "/placeholder.svg"
  )
}

function stringifySearchValue(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .flatMap((entry) => (typeof entry === "string" ? [entry] : entry ? [String(entry)] : []))
      .join(" ")
  }

  if (value === null || value === undefined) {
    return ""
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false"
  }

  return String(value)
}

export function matchesMenuItemSearch(item: MenuItem, query: string) {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return true

  const haystack = [
    item.name,
    item.description,
    item.calories,
    item.calogy,
    item.spice_level,
    item.prep_time,
    item.estimated_prep_time,
    item.prep_minutes,
    item.service_time,
    item.ingredients,
    item.allergens,
    item.dietary_tags,
    item.chef_notes,
    item.notes,
    item.kitchen_notes,
  ]
    .map(stringifySearchValue)
    .join(" ")
    .toLowerCase()

  return haystack.includes(normalizedQuery)
}

function formatPrice(value: number, currency: string) {
  const rounded = Number.isFinite(value) ? value : 0
  return `${currency} ${rounded.toFixed(rounded % 1 === 0 ? 0 : 2)}`
}

export function getItemPriceDetails(item: MenuItem) {
  const hasDiscount = typeof item.discounted_price === "number" && item.discounted_price < item.price
  const currentPrice = hasDiscount ? item.discounted_price! : item.price
  const originalPrice = hasDiscount ? item.price : undefined
  return {
    currentPriceLabel: formatPrice(currentPrice, item.currency),
    originalPriceLabel: originalPrice !== undefined ? formatPrice(originalPrice, item.currency) : null,
    discountLabel: item.discount?.label || null,
    hasDiscount,
  }
}

export function isPopularItem(item: MenuItem) {
  return Boolean(
    item.is_popular ||
      item.is_featured ||
      item.chef_pick ||
      item.chef_choice ||
      item.rating_count && item.rating_count >= 1
  )
}

export function isChefChoice(item: MenuItem) {
  return Boolean(item.chef_pick || item.chef_choice || item.is_featured)
}

export function TemplateShell({
  theme,
  className,
  children,
}: {
  theme: ResolvedTemplateTheme
  className?: string
  children: ReactNode
}) {
  return (
    <div
      style={templateStyle(theme)}
      className={cn("min-h-screen overflow-x-hidden", className)}
    >
      {children}
    </div>
  )
}

export function DecorativeBackdrop({
  theme,
  variant,
}: {
  theme: ResolvedTemplateTheme
  variant: MenuTemplateVariant
}) {
  if (variant === "restaurant") {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-6 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(217,180,111,0.22),transparent_68%)] blur-3xl sm:h-72 sm:w-72" />
        <div className="absolute -right-24 top-24 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(141,90,60,0.24),transparent_70%)] blur-3xl sm:h-80 sm:w-80" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.03))]" />
        <div
          className="absolute left-1/2 top-24 h-px w-[120%] -translate-x-1/2 opacity-40"
          style={{ background: `linear-gradient(90deg, transparent, ${theme.primaryColor}, transparent)` }}
        />
      </div>
    )
  }

  if (variant === "hotel") {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-10 h-60 w-60 rounded-full bg-[radial-gradient(circle,rgba(196,164,107,0.2),transparent_70%)] blur-3xl sm:h-80 sm:w-80" />
        <div className="absolute -right-28 top-40 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(140,106,56,0.16),transparent_72%)] blur-3xl sm:h-96 sm:w-96" />
        <div className="absolute inset-x-0 top-20 h-px bg-[linear-gradient(90deg,transparent,rgba(140,106,56,0.28),transparent)]" />
        <div className="absolute right-8 top-6 grid grid-cols-6 gap-2 opacity-50 sm:right-12 sm:top-10">
          {Array.from({ length: 12 }).map((_, index) => (
            <span
              key={index}
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: index % 2 === 0 ? theme.primaryColor : theme.secondaryColor }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-24 top-0 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(138,90,60,0.2),transparent_68%)] blur-3xl sm:h-80 sm:w-80" />
      <div className="absolute -right-20 top-32 h-60 w-60 rounded-full bg-[radial-gradient(circle,rgba(216,194,164,0.26),transparent_70%)] blur-3xl sm:h-72 sm:w-72" />
      <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0.28),transparent)]" />
      <div className="absolute bottom-8 right-8 grid grid-cols-8 gap-2 opacity-45 sm:bottom-10 sm:right-12">
        {Array.from({ length: 16 }).map((_, index) => (
          <span
            key={index}
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: index % 3 === 0 ? theme.primaryColor : theme.secondaryColor }}
          />
        ))}
      </div>
    </div>
  )
}

export function TemplateAccentCluster({
  theme,
  variant,
}: {
  theme: ResolvedTemplateTheme
  variant: MenuTemplateVariant
}) {
  if (variant === "restaurant") {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute right-4 top-4 hidden sm:block">
        <div className="relative h-24 w-24 rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl">
          <div className="absolute -left-3 -top-3 h-8 w-8 rounded-full bg-[radial-gradient(circle,rgba(217,180,111,0.45),transparent_68%)] blur-md" />
          <div className="grid h-full w-full place-items-center rounded-[20px] border border-white/10 bg-black/25 text-white">
            <UtensilsCrossed className="h-8 w-8" />
          </div>
        </div>
      </div>
    )
  }

  if (variant === "hotel") {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute right-4 top-4 hidden sm:block">
        <div className="relative flex h-28 w-28 flex-col items-center justify-center rounded-[30px] border border-(--menu-border) bg-(--menu-surface) p-4 shadow-2xl backdrop-blur-xl">
          <div className="absolute -left-2 -top-2 h-7 w-7 rounded-full bg-[radial-gradient(circle,rgba(196,164,107,0.38),transparent_68%)] blur-md" />
          <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-[radial-gradient(circle,rgba(140,106,56,0.22),transparent_68%)] blur-md" />
          <Hotel className="h-7 w-7" style={{ color: theme.primaryColor }} />
          <div className="mt-3 flex items-center gap-2">
            <BellRing className="h-4 w-4" style={{ color: theme.secondaryColor }} />
            <KeyRound className="h-4 w-4" style={{ color: theme.secondaryColor }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div aria-hidden="true" className="pointer-events-none absolute right-4 top-4 hidden sm:block">
      <div className="relative flex h-28 w-28 flex-col items-center justify-center rounded-[30px] border border-(--menu-border) bg-(--menu-surface) p-4 shadow-2xl backdrop-blur-xl">
        <div className="absolute -left-2 -top-2 h-8 w-8 rounded-full bg-[radial-gradient(circle,rgba(138,90,60,0.3),transparent_68%)] blur-md" />
        <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-[radial-gradient(circle,rgba(216,194,164,0.25),transparent_68%)] blur-md" />
        <div className="flex items-center gap-3 text-(--menu-primary)">
          <Coffee className="h-7 w-7" />
          <CupSoda className="h-7 w-7" />
        </div>
        <div className="mt-3 flex items-center gap-2 text-(--menu-muted)">
          <Sparkles className="h-4 w-4" />
          <Flame className="h-4 w-4" />
        </div>
      </div>
    </div>
  )
}

function PatternCell({
  fill,
  rotation,
}: {
  fill: string
  rotation: 0 | 90 | 180 | 270
}) {
  return (
    <span
      className="absolute inset-0 rounded-[inherit]"
      style={{
        backgroundColor: fill,
        clipPath: "polygon(0 0, 100% 0, 100% 100%)",
        transform: `rotate(${rotation}deg)`,
        transformOrigin: "center",
      }}
    />
  )
}

export function TemplatePatternBackdrop({
  theme,
  variant,
}: {
  theme: ResolvedTemplateTheme
  variant: MenuTemplateVariant
}) {
  const isCafe = variant === "cafe"
  const isRestaurant = variant === "restaurant"
  const base = isRestaurant ? "rgba(255,255,255,0.03)" : isCafe ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.18)"
  const primary = isRestaurant ? "rgba(217,180,111,0.65)" : isCafe ? "rgba(35, 72, 114, 0.9)" : "rgba(140, 106, 56, 0.85)"
  const secondary = isRestaurant ? "rgba(141,90,60,0.72)" : isCafe ? "rgba(84, 113, 157, 0.75)" : "rgba(196, 164, 107, 0.78)"
  const muted = isRestaurant ? "rgba(184,169,152,0.42)" : isCafe ? "rgba(176, 192, 210, 0.9)" : "rgba(238, 228, 208, 0.95)"

  const cells = [
    [primary, 90], [secondary, 180], [muted, 0], [primary, 90],
    [muted, 0], [secondary, 270], [primary, 180], [muted, 0],
    [primary, 90], [secondary, 180], [muted, 0], [primary, 90],
    [muted, 0], [secondary, 270], [primary, 180], [muted, 0],
  ] as const

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-0 top-0 hidden h-full w-full opacity-[0.18] sm:block">
        <div className="absolute -left-32 top-8 grid grid-cols-4 gap-3 sm:-left-24 sm:top-12">
          {cells.map(([fill, rotation], index) => (
            <div
              key={index}
              className="relative h-16 w-16 overflow-hidden rounded-[22px] sm:h-20 sm:w-20"
              style={{ backgroundColor: base }}
            >
              <PatternCell fill={fill} rotation={rotation} />
            </div>
          ))}
        </div>
        <div className="absolute bottom-8 -right-16 grid grid-cols-4 gap-3 opacity-70 sm:-right-8">
          {cells.map(([fill, rotation], index) => (
            <div
              key={`b-${index}`}
              className="relative h-14 w-14 overflow-hidden rounded-[20px] sm:h-18 sm:w-18"
              style={{ backgroundColor: base }}
            >
              <PatternCell fill={index % 2 === 0 ? secondary : fill} rotation={rotation} />
            </div>
          ))}
        </div>
      </div>

      <div className="absolute inset-x-0 top-0 h-10 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),transparent)]" />
      <div className="absolute inset-x-0 bottom-0 h-12 bg-[linear-gradient(0deg,rgba(255,255,255,0.12),transparent)]" />
    </div>
  )
}

export function TemplateFrameOrnament({
  theme,
  variant,
}: {
  theme: ResolvedTemplateTheme
  variant: MenuTemplateVariant
}) {
  function FlowerCenter() {
    return (
      <span className="relative inline-flex h-8 w-8 items-center justify-center sm:h-10 sm:w-10">
        <span className="absolute inset-0 rounded-full border border-current/20" />
        <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-current/60" />
        <span className="absolute left-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-current/60" />
        <span className="absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-current/60" />
        <span className="absolute bottom-0 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-current/60" />
        <span className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current" />
      </span>
    )
  }

  if (variant === "hotel") {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden md:block">
        <div className="absolute left-7 right-7 top-5 h-px" style={{ backgroundColor: theme.borderColor }} />
        <div className="absolute left-7 right-7 bottom-5 h-px" style={{ backgroundColor: theme.borderColor }} />
        <div className="absolute left-7 top-5 bottom-5 w-px" style={{ backgroundColor: theme.borderColor }} />
        <div className="absolute right-7 top-5 bottom-5 w-px" style={{ backgroundColor: theme.borderColor }} />
        <div className="absolute left-1/2 top-4 flex -translate-x-1/2 items-center gap-4 text-(--menu-muted)">
          <span className="h-px w-16" style={{ backgroundColor: theme.borderColor }} />
          <FlowerCenter />
          <span className="h-px w-16" style={{ backgroundColor: theme.borderColor }} />
        </div>
        <div className="absolute left-1/2 bottom-4 flex -translate-x-1/2 items-center gap-4 text-(--menu-muted)">
          <span className="h-px w-16" style={{ backgroundColor: theme.borderColor }} />
          <FlowerCenter />
          <span className="h-px w-16" style={{ backgroundColor: theme.borderColor }} />
        </div>
      </div>
    )
  }

  if (variant === "restaurant") {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden lg:block">
        <div className="absolute left-6 right-6 top-6 bottom-6 rounded-[34px] border border-white/10" />
        <div className="absolute left-1/2 top-5 flex -translate-x-1/2 items-center gap-3 text-white/50">
          <span className="h-px w-28 bg-white/20" />
          <FlowerCenter />
          <span className="h-px w-28 bg-white/20" />
        </div>
        <div className="absolute left-1/2 bottom-5 flex -translate-x-1/2 items-center gap-3 text-white/40">
          <span className="h-px w-28 bg-white/20" />
          <FlowerCenter />
          <span className="h-px w-28 bg-white/20" />
        </div>
      </div>
    )
  }

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden sm:block">
      <div className="absolute left-5 right-5 top-5 bottom-5 rounded-[30px] border border-(--menu-border)" />
      <div className="absolute left-1/2 top-3 flex -translate-x-1/2 items-center gap-3 text-(--menu-muted)">
        <span className="h-px w-24" style={{ backgroundColor: theme.borderColor }} />
        <FlowerCenter />
        <span className="h-px w-24" style={{ backgroundColor: theme.borderColor }} />
      </div>
      <div className="absolute left-1/2 bottom-3 flex -translate-x-1/2 items-center gap-3 text-(--menu-muted)">
        <span className="h-px w-24" style={{ backgroundColor: theme.borderColor }} />
        <FlowerCenter />
        <span className="h-px w-24" style={{ backgroundColor: theme.borderColor }} />
      </div>
    </div>
  )
}

export function StickyCategoryNav({
  categories,
  activeCategory,
  onCategoryChange,
  theme,
  variant,
  className,
}: {
  categories: Category[]
  activeCategory: string
  onCategoryChange: (id: string) => void
  theme: ResolvedTemplateTheme
  variant: MenuTemplateVariant
  className?: string
}) {
  const isCafe = variant === "cafe"
  const isRestaurant = variant === "restaurant"
  const isHotel = variant === "hotel"
  const backgroundColor = isRestaurant
    ? "rgba(12, 11, 11, 0.82)"
    : isCafe
      ? "rgba(249, 244, 235, 0.9)"
      : "rgba(251, 248, 242, 0.92)"

  return (
    <div
      className={cn(
        "sticky top-0 z-40 border-b backdrop-blur-xl",
        isRestaurant && "border-white/10",
        className
      )}
      style={{ backgroundColor, borderColor: theme.borderColor, boxShadow: `0 10px 30px ${theme.shadowColor}` }}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 overflow-x-auto px-4 py-4 sm:px-6 no-scrollbar">
        {categories.map((category) => {
          const active = activeCategory === category.id
          const activeTextColor = getReadableTextColor(theme.primaryColor, "#FFFFFF", "#121212")
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                "group inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition-all duration-300 sm:text-xs",
                active
                  ? "scale-[1.01] shadow-lg"
                  : "opacity-80 hover:opacity-100 hover:-translate-y-0.5"
              )}
              style={{
                borderColor: active ? theme.primaryColor : theme.borderColor,
                color: active ? activeTextColor : theme.textColor,
                backgroundColor: active ? theme.primaryColor : theme.surfaceColor,
                boxShadow: active ? `0 14px 28px ${theme.shadowColor}` : "none",
              }}
            >
              {category.name}
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-black tracking-normal"
                style={{
                  backgroundColor: active ? theme.surfaceColor : theme.mutedSurfaceColor,
                  color: active ? theme.primaryColor : theme.mutedTextColor,
                }}
              >
                {category.items?.length || 0}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function CategorySection({
  category,
  theme,
  variant,
  children,
  sectionId,
  eyebrow,
  gridClassName,
  className,
  itemCount,
  meta,
}: {
  category: Category
  theme: ResolvedTemplateTheme
  variant: MenuTemplateVariant
  children: ReactNode
  sectionId: string
  eyebrow?: string
  gridClassName?: string
  className?: string
  itemCount?: number
  meta?: ReactNode
}) {
  const isRestaurant = variant === "restaurant"
  const isHotel = variant === "hotel"

  return (
    <section
      id={sectionId}
      className={cn(
        "relative scroll-mt-28 overflow-hidden rounded-[34px] border p-5 sm:p-7 md:p-8",
        isRestaurant && "rounded-[36px]",
        isHotel && "rounded-4xl",
        className
      )}
      style={{
        backgroundColor: theme.surfaceColor,
        borderColor: theme.borderColor,
        boxShadow: `0 24px 60px ${theme.shadowColor}`,
      }}
    >
      <TemplatePatternBackdrop theme={theme} variant={variant} />
      <TemplateFrameOrnament theme={theme} variant={variant} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_34%)]" />
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex items-center gap-3">
            <span
              className="h-1.5 w-10 rounded-full"
              style={{ backgroundColor: theme.primaryColor }}
            />
            {eyebrow ? (
              <span className="text-[10px] font-black uppercase tracking-[0.35em]" style={{ color: theme.mutedTextColor }}>
                {eyebrow}
              </span>
            ) : null}
          </div>
          <div className="space-y-2">
            <h2 className={cn("text-2xl sm:text-3xl md:text-4xl font-black tracking-tight", isHotel && "font-serif")}> 
              {category.name}
            </h2>
            {category.description && (
              <p className="max-w-2xl text-sm sm:text-base leading-relaxed" style={{ color: theme.mutedTextColor }}>
                {category.description}
              </p>
            )}
          </div>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2 md:justify-end">
          {meta}
          <span
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em]"
            style={{ borderColor: theme.borderColor, color: theme.mutedTextColor, backgroundColor: theme.mutedSurfaceColor }}
            aria-label={`${itemCount ?? category.items?.length ?? 0} items`}
          >
            <UtensilsCrossed className="h-3.5 w-3.5" aria-hidden="true" />
            <span aria-hidden="true">{itemCount ?? category.items?.length ?? 0}</span>
          </span>
        </div>
      </div>

      <div className={cn("relative z-10 grid gap-4 sm:gap-5 grid-cols-1 md:grid-cols-2", gridClassName)}>{children}</div>
    </section>
  )
}

export function MenuItemCard({
  item,
  theme,
  variant,
  onClick,
  priority = false,
  index = 0,
}: {
  item: MenuItem
  theme: ResolvedTemplateTheme
  variant: MenuTemplateVariant
  onClick?: () => void
  priority?: boolean
  index?: number
}) {
  const image = getMenuImageSource(item)
  const popular = isPopularItem(item)
  const chefChoice = isChefChoice(item)
  const unavailable = item.is_available === false || item.available === false
  const price = getItemPriceDetails(item)

  if (variant === "cafe") {
    return (
      <motion.button
        type="button"
        onClick={onClick}
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.99 }}
        className="group flex w-full items-start gap-4 rounded-3xl border p-4 text-left transition-all duration-300"
        style={{ backgroundColor: "var(--menu-surface)", borderColor: theme.borderColor, boxShadow: `0 14px 35px ${theme.shadowColor}` }}
      >
        {image ? (
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[20px] sm:h-24 sm:w-24">
            <Image
              src={image}
              alt={item.name}
              fill
              sizes="(max-width: 640px) 80px, 96px"
              priority={priority}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        ) : (
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[20px] text-lg font-black sm:h-24 sm:w-24"
            style={{ backgroundColor: theme.mutedSurfaceColor, color: theme.primaryColor }}
          >
            {(item.name || "?").slice(0, 2).toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <h3 className="truncate text-lg font-semibold sm:text-xl">{item.name}</h3>
              {item.description && (
                <p className="line-clamp-2 text-sm leading-relaxed" style={{ color: theme.mutedTextColor }}>
                  {item.description}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-lg font-bold" style={{ color: theme.primaryColor }}>
                {price.currentPriceLabel}
              </p>
              {price.originalPriceLabel && (
                <p className="text-[10px] font-medium line-through" style={{ color: theme.mutedTextColor }}>
                  {price.originalPriceLabel}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {popular && <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: theme.primaryColor }} />}
            {chefChoice && <Sparkles aria-hidden="true" className="h-3.5 w-3.5" style={{ color: theme.primaryColor }} />}
            {price.discountLabel && !popular && (
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: theme.mutedTextColor }}>
                {price.discountLabel}
              </span>
            )}
          </div>
        </div>
      </motion.button>
    )
  }

  if (variant === "restaurant") {
    return (
      <motion.button
        type="button"
        onClick={onClick}
        whileHover={{ y: -8, scale: 1.01 }}
        whileTap={{ scale: 0.995 }}
        className="group flex h-full w-full flex-col overflow-hidden rounded-[30px] border text-left transition-all duration-500"
        style={{ backgroundColor: theme.surfaceColor, borderColor: theme.borderColor, boxShadow: `0 24px 70px ${theme.shadowColor}` }}
      >
        <div className="relative aspect-4/3 overflow-hidden">
          <Image
            src={image}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 100vw, 420px"
            priority={priority}
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/18 to-transparent" />
          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4 sm:p-5">
            <div className="flex flex-wrap gap-2">
              {popular && <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-white/90 shadow-[0_0_0_6px_rgba(255,255,255,0.12)]" />}
              {chefChoice && <Sparkles aria-hidden="true" className="h-4 w-4 text-white/85" />}
            </div>
            {unavailable && <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-white/70" />}
          </div>
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
            <div className="flex items-end justify-between gap-4 text-white">
              <div className="space-y-1">
                <h3 className="text-2xl font-black leading-tight sm:text-3xl">{item.name}</h3>
              </div>
              <div className="text-right">
                <p className="text-xl font-black sm:text-2xl">{price.currentPriceLabel}</p>
                {price.originalPriceLabel && <p className="text-[11px] text-white/65 line-through">{price.originalPriceLabel}</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
          {item.description && (
            <p className="line-clamp-3 text-sm leading-relaxed" style={{ color: theme.mutedTextColor }}>
              {item.description}
            </p>
          )}
          <div className="mt-auto flex flex-wrap items-center gap-2">
            {price.discountLabel && (
              <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]" style={{ borderColor: theme.borderColor, color: theme.primaryColor }}>
                <Sparkles className="h-3.5 w-3.5" />
                {price.discountLabel}
              </span>
            )}
            {(item.rating || item.rating_count) && (
              <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]" style={{ borderColor: theme.borderColor, color: theme.mutedTextColor }}>
                <Star className="h-3.5 w-3.5 fill-current" />
                {Number(item.rating || 0).toFixed(1)}
              </span>
            )}
            {popular && <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: theme.primaryColor }} />}
            {chefChoice && <Sparkles aria-hidden="true" className="h-3.5 w-3.5" style={{ color: theme.primaryColor }} />}
          </div>
        </div>
      </motion.button>
    )
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.995 }}
      className="group flex w-full items-center gap-4 rounded-3xl border px-4 py-4 text-left transition-all duration-300 sm:px-5 sm:py-5"
      style={{ backgroundColor: theme.surfaceColor, borderColor: theme.borderColor, boxShadow: `0 16px 40px ${theme.shadowColor}` }}
    >
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[20px] sm:h-24 sm:w-24">
        <Image
          src={image}
          alt={item.name}
          fill
          sizes="(max-width: 640px) 80px, 96px"
          priority={priority}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h3 className="truncate text-base font-semibold sm:text-lg">{item.name}</h3>
            <p className="line-clamp-2 text-sm leading-relaxed" style={{ color: theme.mutedTextColor }}>
              {item.description}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1 text-right">
            <p className="text-base font-black sm:text-lg" style={{ color: theme.primaryColor }}>
              {price.currentPriceLabel}
            </p>
            {price.originalPriceLabel && <p className="text-[11px] line-through" style={{ color: theme.mutedTextColor }}>{price.originalPriceLabel}</p>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {price.discountLabel && (
            <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em]" style={{ borderColor: theme.borderColor, color: theme.primaryColor }}>
              <Sparkles className="h-3.5 w-3.5" />
              {price.discountLabel}
            </span>
          )}
          {(item.rating || item.rating_count) && (
            <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em]" style={{ borderColor: theme.borderColor, color: theme.mutedTextColor }}>
              <Star className="h-3.5 w-3.5 fill-current" />
              {Number(item.rating || 0).toFixed(1)}
            </span>
          )}
          {item.service_time && (
            <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em]" style={{ borderColor: theme.borderColor, color: theme.mutedTextColor }}>
              <Clock3 className="h-3.5 w-3.5" />
              {item.service_time}
            </span>
          )}
        </div>
      </div>

      <ArrowRight className="h-4 w-4 shrink-0 opacity-35 transition-transform duration-300 group-hover:translate-x-1" style={{ color: theme.mutedTextColor }} />
    </motion.button>
  )
}

export function MenuLoadingState({
  theme,
  variant,
}: {
  theme: ResolvedTemplateTheme
  variant: MenuTemplateVariant
}) {
  const skeletonCard = variant === "restaurant"
    ? "aspect-[4/3] rounded-[30px]"
    : variant === "hotel"
      ? "h-28 rounded-[24px]"
      : "h-24 rounded-[24px]"

  return (
    <div className="space-y-8">
      {Array.from({ length: 3 }).map((_, sectionIndex) => (
        <div
          key={sectionIndex}
          className="rounded-4xl border p-5 sm:p-7 md:p-8"
          style={{ backgroundColor: theme.surfaceColor, borderColor: theme.borderColor }}
        >
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <div className="h-2.5 w-24 rounded-full" style={{ backgroundColor: theme.mutedSurfaceColor }} />
              <div className="h-8 w-56 rounded-2xl" style={{ backgroundColor: theme.mutedSurfaceColor }} />
              <div className="h-4 w-full max-w-xl rounded-full" style={{ backgroundColor: theme.mutedSurfaceColor }} />
            </div>
            <div className="h-9 w-28 rounded-full" style={{ backgroundColor: theme.mutedSurfaceColor }} />
          </div>
          <div className={cn("grid gap-4 sm:gap-5", variant === "restaurant" ? "md:grid-cols-2 xl:grid-cols-3" : "md:grid-cols-2")}>
            {Array.from({ length: 4 }).map((__, cardIndex) => (
              <div key={cardIndex} className={cn("overflow-hidden border", skeletonCard)} style={{ backgroundColor: theme.mutedSurfaceColor, borderColor: theme.borderColor }}>
                <div className="h-full animate-pulse bg-linear-to-br from-white/10 via-white/20 to-transparent" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function MenuEmptyState({
  theme,
  title,
  description,
  onReset,
}: {
  theme: ResolvedTemplateTheme
  title: string
  description: string
  onReset?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-4xl border px-6 py-16 text-center" style={{ backgroundColor: theme.surfaceColor, borderColor: theme.borderColor }}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: theme.mutedSurfaceColor, color: theme.primaryColor }}>
        <Sparkles className="h-7 w-7" />
      </div>
      <h3 className="sr-only">{title}</h3>
      <p className="sr-only">{description}</p>
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          aria-label="Reset search"
          className="mt-6 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em]"
          style={{ backgroundColor: theme.primaryColor, color: theme.surfaceColor }}
        >
          <span aria-hidden="true">•</span>
        </button>
      )}
    </div>
  )
}

export function TemplateFooterCTA({
  theme,
  variant,
  primaryLabel,
  homeLabel = "Create menu for your restaurant",
  onPrimary,
  homeHref = "/",
}: {
  theme: ResolvedTemplateTheme
  variant: MenuTemplateVariant
  primaryLabel: string
  homeLabel?: string
  onPrimary?: () => void
  homeHref?: string
}) {
  const isRestaurant = variant === "restaurant"
  const isHotel = variant === "hotel"

  return (
    <div
      className={cn(
        "rounded-[28px] border px-4 py-4 sm:px-5 sm:py-5",
        isRestaurant ? "bg-white/5" : "bg-(--menu-surface)"
      )}
      style={{ borderColor: theme.borderColor, boxShadow: `0 18px 40px ${theme.shadowColor}` }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={homeHref}
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-transform hover:-translate-y-0.5"
            style={{
              borderColor: theme.borderColor,
              backgroundColor: theme.surfaceColor,
              color: theme.textColor,
            }}
          >
            {homeLabel}
          </Link>
          <div className="hidden h-8 w-px bg-border/60 sm:block" />
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.35em]" style={{ color: theme.mutedTextColor }}>
              Powered by Agelgil
            </p>
            <p className={cn("text-sm font-medium", isHotel && "font-serif")} style={{ color: theme.textColor }}>
              Fast digital menus with visual style.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onPrimary}
            className="rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-transform hover:-translate-y-0.5"
            style={{
              borderColor: theme.borderColor,
              backgroundColor: theme.primaryColor,
              color: getReadableTextColor(theme.primaryColor, "#FFFFFF", "#111111"),
            }}
          >
            {primaryLabel}
          </button>
          <div className="flex items-center gap-2 rounded-full border px-3 py-2" style={{ borderColor: theme.borderColor, backgroundColor: theme.surfaceColor }}>
            <Logo width={78} height={24} grayscale={false} />
          </div>
        </div>
      </div>
    </div>
  )
}
