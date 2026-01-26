"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, Coffee, Leaf, ChefHat } from "lucide-react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { Logo } from "@/components/logo"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <nav 
      className={cn(
        "fixed top-0 z-[100] w-full transition-all duration-500",
        isScrolled 
          ? "py-4 bg-background/80 backdrop-blur-2xl border-b border-border" 
          : "py-8 bg-transparent"
      )}
    >
      <div className="container flex items-center justify-between px-6 mx-auto">
        <Link href="/" className="flex items-center gap-2 group">
          <Logo width={40} height={40} className="-ml-2" />
          <span className="hidden sm:block text-2xl font-serif text-primary italic tracking-tight transition-transform group-hover:scale-105 active:scale-95">አገልግል</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center space-x-12">
          {["Features", "Design", "Demo"].map((item) => (
            <Link
              key={item}
              href={`/#${item.toLowerCase()}`}
              className="text-[11px] font-black tracking-[0.3em] uppercase text-muted-foreground transition-all hover:text-primary relative group"
            >
              {item}
              <span className="absolute -bottom-2 left-0 w-0 h-[2px] bg-primary transition-all duration-500 group-hover:w-full" />
            </Link>
          ))}
          
          <div className="flex items-center space-x-6 pl-6 border-l border-border">
            <Link 
              href="/login" 
              className="text-[11px] font-black tracking-[0.3em] uppercase text-foreground hover:text-primary transition-colors"
            >
              Login
            </Link>
            <Button
              className="h-12 px-8 text-[11px] font-black tracking-[0.3em] uppercase rounded-2xl bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20 transition-all active:scale-95 text-white"
              asChild
            >
              <Link href="/register">Join Platform</Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile Toggle */}
        <div className="flex items-center gap-4 md:hidden">
          <ThemeToggle />
          <button
            className="flex items-center justify-center rounded-2xl h-12 w-12 bg-muted border border-border text-foreground hover:bg-muted/80 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-0 z-[-1] pt-32 pb-12 bg-background border-b border-border px-8 shadow-2xl md:hidden flex flex-col gap-10"
          >
            <div className="flex flex-col gap-6">
              {["Features", "Design", "Demo"].map((item) => (
                <Link
                  key={item}
                  href={`/#${item.toLowerCase()}`}
                  className="text-4xl font-serif text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {item}
                </Link>
              ))}
            </div>
            
            <div className="flex flex-col gap-4">
              <Button
                variant="outline"
                className="w-full h-16 rounded-2xl border-border text-foreground text-lg font-bold bg-muted/50"
                asChild
              >
                <Link href="/login" onClick={() => setIsOpen(false)}>
                  Sign In
                </Link>
              </Button>
              <Button className="w-full h-16 rounded-2xl text-lg font-bold bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20 text-white" asChild>
                <Link href="/register" onClick={() => setIsOpen(false)}>
                  Get Started
                </Link>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
