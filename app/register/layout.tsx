import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Register",
  description: "Join MenuVista and transform your restaurant menu into an elegant digital experience.",
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
