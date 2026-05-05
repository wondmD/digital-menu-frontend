"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { MoonStar, Search, Sun } from "lucide-react"
import Image from "next/image"
import { useTheme } from "next-themes"
import { Input } from "@/components/ui/input"
import { cn, getImageUrl } from "@/lib/utils"
import { TemplateProps } from "./types"
import {
  CategorySection,
  MenuEmptyState,
  MenuItemCard,
  MenuLoadingState,
  matchesMenuItemSearch,
  StickyCategoryNav,
  TemplateFooterCTA,
  TemplateShell,
  getCategorySectionId,
  resolveTemplateTheme,
} from "./shared"

export default function Template1({
  hotel,
  categories,
  activeCategory,
  onCategoryChange,
  onItemClick,
  searchQuery,
  onSearchChange,
  itemsLoading,
  theme,
}: TemplateProps) {
  const { resolvedTheme: appTheme, setTheme } = useTheme()
  const isDark = appTheme === "dark"
  const resolvedTheme = resolveTemplateTheme("cafe", theme, isDark ? "dark" : "light")
  const logoImage = getImageUrl(hotel.logo_url || (hotel as any).logo_image_url)

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const visibleCategories = useMemo(() => {
    return categories
      .map((category) => {
        const items = (category.items || []).filter((item) => matchesMenuItemSearch(item, normalizedQuery))

        return {
          ...category,
          items,
        }
      })
      .filter((category) => category.items && category.items.length > 0)
  }, [categories, normalizedQuery])

  const activeSection = visibleCategories.some((category) => category.id === activeCategory)
    ? activeCategory
    : visibleCategories[0]?.id || activeCategory

  const selectedCategory = visibleCategories.find((category) => category.id === activeSection) || visibleCategories[0] || null

  const handleCategoryChange = (categoryId: string) => {
    onCategoryChange(categoryId)
  }

  return (
    <TemplateShell
      theme={resolvedTheme}
      className={
        isDark
          ? "bg-[radial-gradient(circle_at_top,rgba(217,185,138,0.14),transparent_55%),linear-gradient(180deg,#14120F_0%,#0F0D0B_55%,#12100E_100%)]"
          : "bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.9),transparent_55%),linear-gradient(180deg,#F9F3E9_0%,#F4EADF_42%,#F7F1E8_100%)]"
      }
    >
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-4 sm:px-6 lg:px-8">
        <motion.header
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-5 overflow-hidden rounded-[34px] border p-5 shadow-[0_18px_50px_rgba(138,90,60,0.1)] sm:p-6 lg:p-7"
          style={{ backgroundColor: "var(--menu-surface)", borderColor: resolvedTheme.borderColor }}
        >
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none opacity-90">
            <div className="absolute -left-16 top-8 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(138,90,60,0.16),transparent_68%)] blur-2xl sm:h-56 sm:w-56" />
            <div className="absolute -right-12 -bottom-8 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(216,194,164,0.24),transparent_68%)] blur-2xl sm:h-72 sm:w-72" />
          </div>
          <div className="relative z-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-5">
              <div className="space-y-3">
                <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  {hotel.name}
                </h1>
                {hotel.description ? (
                  <p className="max-w-2xl text-sm leading-relaxed sm:text-base" style={{ color: resolvedTheme.mutedTextColor }}>
                    {hotel.description}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex min-w-56 flex-1 items-center gap-3 rounded-full border px-4 py-3 shadow-sm" style={{ backgroundColor: resolvedTheme.mutedSurfaceColor, borderColor: resolvedTheme.borderColor }}>
                  <Search className="h-4 w-4 shrink-0" style={{ color: resolvedTheme.mutedTextColor }} />
                  <Input
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    aria-label="Search menu items"
                    placeholder=""
                    className="h-auto border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
                    style={{ color: resolvedTheme.textColor }}
                  />
                </div>
                {logoImage && (
                  <div className="relative h-14 w-14 overflow-hidden rounded-[18px] border sm:h-16 sm:w-16" style={{ borderColor: resolvedTheme.borderColor, backgroundColor: resolvedTheme.surfaceColor }}>
                    <Image src={logoImage} alt={hotel.name} fill sizes="64px" className="object-contain p-2" priority />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setTheme(isDark ? "light" : "dark")}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full border transition-transform hover:-translate-y-0.5"
                  style={{ borderColor: resolvedTheme.borderColor, backgroundColor: resolvedTheme.surfaceColor, color: resolvedTheme.textColor }}
                  aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
                >
                  {isDark ? <Sun className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
                </button>
              </div>
            </div>

          </div>
        </motion.header>

        <StickyCategoryNav
          categories={categories}
          activeCategory={activeSection}
          onCategoryChange={handleCategoryChange}
          theme={resolvedTheme}
          variant="cafe"
          className="top-0 rounded-3xl border"
        />

        <main className="space-y-7 pt-6">
          {itemsLoading ? (
            <MenuLoadingState theme={resolvedTheme} variant="cafe" />
          ) : selectedCategory ? (
            <CategorySection
              key={selectedCategory.id}
              category={selectedCategory}
              sectionId={getCategorySectionId(selectedCategory.id)}
              theme={resolvedTheme}
              variant="cafe"
              itemCount={selectedCategory.items?.length}
              gridClassName="grid-cols-1 sm:grid-cols-2 md:grid-cols-2"
            >
              {selectedCategory.items?.map((item, itemIndex) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  theme={resolvedTheme}
                  variant="cafe"
                  onClick={() => onItemClick(item)}
                  priority={itemIndex < 2}
                />
              ))}
            </CategorySection>
          ) : (
            <MenuEmptyState
              theme={resolvedTheme}
              title="No matching items"
              description={normalizedQuery ? "Try another search term or browse a different category." : "This menu does not have items yet. Add dishes in the dashboard to see them here."}
              onReset={normalizedQuery ? () => onSearchChange("") : undefined}
            />
          )}
        </main>

        <footer className="sticky bottom-4 z-30 mt-9 space-y-3 rounded-4xl border bg-background/90 p-3 shadow-[0_12px_30px_rgba(0,0,0,0.1)] backdrop-blur-xl sm:p-4" style={{ borderColor: resolvedTheme.borderColor }}>
          <TemplateFooterCTA
            theme={resolvedTheme}
            variant="cafe"
            primaryLabel="Back to top"
            onPrimary={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            homeHref="/"
          />
        </footer>
      </div>
    </TemplateShell>
  )
}