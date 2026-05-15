import { ReactNode } from "react"

export default function PartnerLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">{children}</div>
}
