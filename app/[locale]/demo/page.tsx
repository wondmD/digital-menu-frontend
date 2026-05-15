import { Metadata } from "next"
import DemoClient from "./demo-client"

export const metadata: Metadata = {
  title: "Live Demo | Agelgil Digital Menu Experience",
  description: "Experience the elegance of Agelgil digital menus. Explore our handcrafted templates and see how contactless dining looks for your restaurant.",
}

export default function DemoPage() {
  return <DemoClient />
}
