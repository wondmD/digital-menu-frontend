import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pricing Packages",
  description: "Explore our flexible pricing plans for digital menus. From small cafés to large hotel chains.",
}

export default function PackagesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
