"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { Search, Clock3 } from "lucide-react"
import Image from "next/image"
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

export default function Template3({
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
  const resolvedTheme = resolveTemplateTheme("hotel", theme)
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
      className="bg-[linear-gradient(180deg,#FAF7F1_0%,#F4EFE6_100%)]"
    >
      <div className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-8">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[34px] border p-6 sm:p-8 lg:p-10"
          style={{ backgroundColor: "rgba(255,255,255,0.92)", borderColor: resolvedTheme.borderColor, boxShadow: `0 24px 60px ${resolvedTheme.shadowColor}` }}
        >
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none opacity-90">
            <div className="absolute -left-16 top-8 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(140,106,56,0.12),transparent_68%)] blur-2xl sm:h-56 sm:w-56" />
            <div className="absolute -right-12 -bottom-8 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(196,164,107,0.14),transparent_68%)] blur-2xl sm:h-72 sm:w-72" />
          </div>
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-6">
              <div className="space-y-4">
                <h1 className="max-w-3xl font-serif text-4xl leading-tight tracking-tight sm:text-5xl lg:text-6xl" style={{ color: resolvedTheme.textColor }}>
                  {hotel.name}
                </h1>
                {hotel.description ? (
                  <p className="max-w-2xl text-sm leading-relaxed sm:text-base" style={{ color: resolvedTheme.mutedTextColor }}>
                    {hotel.description}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-3 rounded-full border px-4 py-3" style={{ backgroundColor: resolvedTheme.surfaceColor, borderColor: resolvedTheme.borderColor }}>
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
                  <div className="relative h-14 w-14 overflow-hidden rounded-[18px] border" style={{ borderColor: resolvedTheme.borderColor, backgroundColor: resolvedTheme.surfaceColor }}>
                    <Image src={logoImage} alt={hotel.name} fill sizes="56px" className="object-contain p-2" priority />
                  </div>
                )}
              </div>
            </div>

          </div>
        </motion.header>

        <div className="mt-6 rounded-[28px] border px-3 py-3 shadow-[0_20px_50px_rgba(84,62,33,0.08)]" style={{ backgroundColor: resolvedTheme.surfaceColor, borderColor: resolvedTheme.borderColor }}>
          <StickyCategoryNav
            categories={categories}
            activeCategory={activeSection}
            onCategoryChange={handleCategoryChange}
            theme={resolvedTheme}
            variant="hotel"
            className="top-0 rounded-[22px] border-0 bg-transparent"
          />
        </div>

        <main className="space-y-8 pt-8">
          {itemsLoading ? (
            <MenuLoadingState theme={resolvedTheme} variant="hotel" />
          ) : selectedCategory ? (
            <CategorySection
              category={selectedCategory}
              sectionId={getCategorySectionId(selectedCategory.id)}
              theme={resolvedTheme}
              variant="hotel"
              gridClassName="grid-cols-1"
              itemCount={selectedCategory.items?.length}
              meta={
                <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em]" style={{ backgroundColor: resolvedTheme.mutedSurfaceColor, borderColor: resolvedTheme.borderColor, color: resolvedTheme.primaryColor }} aria-label="Section detail">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span aria-hidden="true">•</span>
                </span>
              }
              className="rounded-[28px]"
            >
              {selectedCategory.items?.map((item, itemIndex) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  theme={resolvedTheme}
                  variant="hotel"
                  onClick={() => onItemClick(item)}
                  priority={itemIndex < 1}
                />
              ))}
            </CategorySection>
          ) : (
            <MenuEmptyState
              theme={resolvedTheme}
              title="Nothing matches this search"
              description={normalizedQuery ? "Try another term or clear the search to see the full hotel menu." : "Add dishes in the dashboard to populate the hospitality menu."}
              onReset={normalizedQuery ? () => onSearchChange("") : undefined}
            />
          )}
        </main>

        <footer className="sticky bottom-4 z-30 mt-14 space-y-4 rounded-4xl border bg-background/90 p-3 shadow-[0_20px_60px_rgba(84,62,33,0.12)] backdrop-blur-xl sm:p-4" style={{ borderColor: resolvedTheme.borderColor }}>
          <TemplateFooterCTA
            theme={resolvedTheme}
            variant="hotel"
            primaryLabel="Back to top"
            onPrimary={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            homeHref="/"
          />
        </footer>
      </div>
    </TemplateShell>
  )
}