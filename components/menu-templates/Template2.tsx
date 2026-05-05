"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { Flame, MoonStar, Search, Sun } from "lucide-react"
import Image from "next/image"
import { useTheme } from "next-themes"
import { Input } from "@/components/ui/input"
import { getImageUrl } from "@/lib/utils"
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

export default function Template2({
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
  const resolvedTheme = resolveTemplateTheme("restaurant", theme, isDark ? "dark" : "light")
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
          ? "bg-[radial-gradient(circle_at_top,rgba(217,180,111,0.1),transparent_40%),linear-gradient(180deg,#0D0B0B_0%,#0A0909_100%)]"
          : "bg-[radial-gradient(circle_at_top,rgba(161,107,47,0.14),transparent_45%),linear-gradient(180deg,#FCF8F3_0%,#F7EEE2_100%)]"
      }
    >
      <div className="mx-auto max-w-6xl px-4 pb-28 pt-4 sm:px-6 lg:px-8">
        <motion.header
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[36px] border p-5 sm:p-7 lg:p-8"
          style={{ backgroundColor: resolvedTheme.surfaceColor, borderColor: resolvedTheme.borderColor, boxShadow: `0 30px 90px ${resolvedTheme.shadowColor}` }}
        >
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none opacity-90">
            <div className="absolute -right-16 top-6 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(217,180,111,0.14),transparent_68%)] blur-2xl sm:h-56 sm:w-56" />
            <div className="absolute -left-10 -bottom-8 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(141,90,60,0.14),transparent_68%)] blur-2xl sm:h-72 sm:w-72" />
          </div>
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="space-y-6">
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl" style={{ color: resolvedTheme.textColor }}>
                  {hotel.name}
                </h1>
                {hotel.description ? (
                  <p className="max-w-2xl text-sm leading-relaxed sm:text-base" style={{ color: resolvedTheme.mutedTextColor }}>
                    {hotel.description}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-full border px-4 py-3 backdrop-blur-xl"
                  style={{ borderColor: resolvedTheme.borderColor, backgroundColor: resolvedTheme.mutedSurfaceColor }}
                >
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
                  <div
                    className="relative h-14 w-14 overflow-hidden rounded-2xl border shadow-2xl sm:h-16 sm:w-16"
                    style={{ borderColor: resolvedTheme.borderColor, backgroundColor: resolvedTheme.surfaceColor }}
                  >
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

        <div
          className="mt-6 rounded-[30px] border p-3 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl"
          style={{ borderColor: resolvedTheme.borderColor, backgroundColor: resolvedTheme.surfaceColor }}
        >
          <StickyCategoryNav
            categories={categories}
            activeCategory={activeSection}
            onCategoryChange={handleCategoryChange}
            theme={resolvedTheme}
            variant="restaurant"
            className="top-0 rounded-3xl border-0 bg-transparent"
          />
        </div>

        <main className="space-y-7 pt-6">
          {itemsLoading ? (
            <MenuLoadingState theme={resolvedTheme} variant="restaurant" />
          ) : selectedCategory ? (
            <motion.div
              key={selectedCategory.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <CategorySection
                category={selectedCategory}
                sectionId={getCategorySectionId(selectedCategory.id)}
                theme={resolvedTheme}
                variant="restaurant"
                itemCount={selectedCategory.items?.length}
                gridClassName="grid-cols-1 sm:grid-cols-2 md:grid-cols-2"
                meta={
                  (() => {
                    const popularCount = (selectedCategory.items || []).filter((item) => Boolean(item.is_popular || item.is_featured || item.chef_choice || item.chef_pick)).length
                    return popularCount > 0 ? (
                      <span
                        className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]"
                        style={{ borderColor: resolvedTheme.borderColor, backgroundColor: resolvedTheme.mutedSurfaceColor, color: resolvedTheme.mutedTextColor }}
                        aria-label={`${popularCount} highlighted items`}
                      >
                        <Flame className="h-3.5 w-3.5" style={{ color: resolvedTheme.primaryColor }} aria-hidden="true" />
                        <span aria-hidden="true">{popularCount}</span>
                      </span>
                    ) : undefined
                  })()
                }
              >
                {selectedCategory.items?.map((item, itemIndex) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    theme={resolvedTheme}
                    variant="restaurant"
                    onClick={() => onItemClick(item)}
                    priority={itemIndex < 1}
                    index={itemIndex}
                  />
                ))}
              </CategorySection>
            </motion.div>
          ) : (
            <MenuEmptyState
              theme={resolvedTheme}
              title="No dishes match your search"
              description={normalizedQuery ? "Try a broader term or clear the search to see the full tasting lineup." : "This menu is waiting for dishes to be added in the dashboard."}
              onReset={normalizedQuery ? () => onSearchChange("") : undefined}
            />
          )}
        </main>

        <footer
          className="sticky bottom-4 z-30 mt-10 space-y-3 rounded-4xl border p-3 shadow-[0_12px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:p-4"
          style={{ borderColor: resolvedTheme.borderColor, backgroundColor: resolvedTheme.surfaceColor }}
        >
          <TemplateFooterCTA
            theme={resolvedTheme}
            variant="restaurant"
            primaryLabel="Back to top"
            onPrimary={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            homeHref="/"
          />
        </footer>
      </div>
    </TemplateShell>
  )
}