import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Login",
  description: "Log in to your MenuQR partner dashboard to manage your digital menus.",
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
