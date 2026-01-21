"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, Coffee, Leaf, ChefHat } from "lucide-react"
import { useState } from "react"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-primary/5 bg-[#FDFCF8]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-[#FDFCF8]/60 transition-all duration-300">
      <div className="container flex h-20 items-center justify-between px-6 mx-auto">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="rounded-xl bg-primary p-2 text-white shadow-lg shadow-primary/20 group-hover:rotate-12 transition-transform">
            <ChefHat className="h-5 w-5" />
          </div>
          <span className="text-2xl font-serif font-normal tracking-tight text-primary">MenuQR</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center md:space-x-10">
          <Link
            href="/#features"
            className="text-sm font-bold tracking-wide uppercase text-muted-foreground transition-all hover:text-primary hover:tracking-widest"
          >
            Features
          </Link>
          <Link
            href="/#how-it-works"
            className="text-sm font-bold tracking-wide uppercase text-muted-foreground transition-all hover:text-primary hover:tracking-widest"
          >
            Process
          </Link>
          <Link
            href="/menu/golden-leaf"
            className="text-sm font-bold tracking-wide uppercase text-muted-foreground transition-all hover:text-primary hover:tracking-widest"
          >
            Demo
          </Link>
          <div className="flex items-center space-x-5">
            <Button
              variant="ghost"
              className="text-sm font-bold tracking-wide uppercase text-primary hover:bg-primary/5 rounded-full px-6"
              asChild
            >
              <Link href="/login">Login</Link>
            </Button>
            <Button
              className="h-11 px-8 text-sm font-bold tracking-wide uppercase rounded-full shadow-lg shadow-primary/10"
              asChild
            >
              <Link href="/register">Join Us</Link>
            </Button>
          </div>
        </div>

        {/* Mobile Toggle */}
        <button
          className="flex items-center justify-center rounded-2xl p-2.5 md:hidden bg-primary/5 text-primary"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="fixed inset-x-0 top-20 z-50 grid w-full gap-6 bg-[#FDFCF8] p-8 shadow-2xl animate-in slide-in-from-top-4 md:hidden border-b border-primary/10 rounded-b-[2rem]">
          <div className="grid gap-4">
            <Link
              href="/#features"
              className="flex w-full items-center py-3 text-2xl font-serif text-primary border-b border-primary/5"
              onClick={() => setIsOpen(false)}
            >
              Our Features
            </Link>
            <Link
              href="/#how-it-works"
              className="flex w-full items-center py-3 text-2xl font-serif text-primary border-b border-primary/5"
              onClick={() => setIsOpen(false)}
            >
              The Process
            </Link>
            <Link
              href="/menu/golden-leaf"
              className="flex w-full items-center py-3 text-2xl font-serif text-primary"
              onClick={() => setIsOpen(false)}
            >
              Live Experience
            </Link>
          </div>
          <div className="flex flex-col gap-4 mt-4">
            <Button
              variant="outline"
              className="w-full h-14 rounded-2xl border-primary/20 text-primary text-lg font-bold bg-transparent"
              asChild
            >
              <Link href="/login" onClick={() => setIsOpen(false)}>
                Partner Login
              </Link>
            </Button>
            <Button className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20" asChild>
              <Link href="/register" onClick={() => setIsOpen(false)}>
                Get Started
              </Link>
            </Button>
          </div>
          <div className="flex justify-center pt-4">
            <Leaf className="h-8 w-8 text-primary/10" />
          </div>
        </div>
      )}
    </nav>
  )
}
