import Link from "next/link"
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { QrCode, LayoutDashboard, Smartphone, CheckCircle, ArrowRight, Sparkles } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FDFCF8] relative overflow-hidden">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-20 pb-24 md:pt-32 md:pb-40">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-white to-secondary/10" />
          <div className="absolute right-4 top-8 w-[420px] h-[420px] hidden lg:block opacity-80 blur-[1px]">
            <Image
              src="/cafe.webp"
              alt="Café ambiance"
              fill
              className="object-cover rounded-full shadow-2xl shadow-primary/20 animate-[float_10s_ease-in-out_infinite]"
              sizes="420px"
              priority
            />
          </div>
          <div className="absolute left-2 bottom-0 w-[360px] h-[360px] hidden lg:block opacity-70">
            <Image
              src="/hotel.webp"
              alt="Hotel venue"
              fill
              className="object-cover rounded-[48px] shadow-xl shadow-secondary/30 animate-[float_12s_ease-in-out_infinite_reverse]"
              sizes="360px"
              priority
            />
          </div>

          <div className="container relative z-10 mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary mb-8 border border-primary/10 animate-in fade-in slide-in-from-top-4 duration-700">
              <Sparkles className="h-4 w-4" />
              <span>Redefining Digital Dining</span>
            </div>
            <h1 className="mx-auto max-w-5xl font-serif text-5xl font-normal leading-[1.1] tracking-tight sm:text-7xl md:text-8xl text-primary mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              The <span className="italic">Fresh</span> Approach to Digital Menus
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground sm:text-xl font-medium animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              Elevate your hotel or café with a nature-inspired, contactless menu that customers love to browse.
              Beautiful, fast, and effortless.
            </p>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
              <Button
                size="lg"
                className="h-14 px-10 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                asChild
              >
                <Link href="/register">Start Your Journey</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-10 text-lg font-bold border-primary/20 text-primary hover:bg-primary/5 rounded-2xl bg-transparent"
                asChild
              >
                <Link href="/menu/golden-leaf">Live Demo</Link>
              </Button>
            </div>
          </div>
          <div className="absolute top-0 left-0 w-1/3 h-1/2 bg-primary/10 rounded-full blur-[140px] -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-secondary/30 rounded-full blur-[140px] translate-x-1/2 translate-y-1/2" />
        </section>

        {/* Features Section */}
        <section id="features" className="py-32 bg-white">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
              <div className="max-w-2xl">
                <h2 className="text-4xl font-serif font-normal sm:text-5xl text-primary mb-4">
                  Crafted for Exceptional Guest Experiences
                </h2>
                <p className="text-muted-foreground text-lg">Sophisticated tools for modern establishments.</p>
              </div>
              <Button variant="link" className="text-primary font-bold text-lg p-0 h-auto">
                View all features <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature, index) => (
                <Card
                  key={index}
                  className="border-primary/5 bg-[#FDFCF8] shadow-sm hover:shadow-md transition-all rounded-3xl group"
                >
                  <CardContent className="pt-8 pb-8 px-8">
                    <div className="mb-6 inline-flex rounded-2xl bg-primary/10 p-4 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      {feature.icon}
                    </div>
                    <h3 className="mb-3 text-2xl font-serif font-normal text-primary">{feature.title}</h3>
                    <p className="text-muted-foreground font-medium leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section id="how-it-works" className="py-32 bg-[#FDFCF8]">
          <div className="container mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-4xl font-serif font-normal sm:text-5xl text-primary">
                Three Steps to Freshness
              </h2>
              <p className="mt-4 text-muted-foreground text-lg">Launch your digital menu in record time.</p>
            </div>
            <div className="grid gap-16 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <div key={index} className="relative text-center group">
                  <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary text-3xl font-serif text-white shadow-xl shadow-primary/20 transition-transform group-hover:scale-110">
                    {index + 1}
                  </div>
                  <h3 className="mb-3 text-2xl font-serif font-normal text-primary">{step.title}</h3>
                  <p className="text-muted-foreground font-medium">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-primary/5 bg-white py-20">
        <div className="container mx-auto px-6">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <div className="rounded-xl bg-primary p-2 text-white shadow-lg shadow-primary/20">
                  <QrCode className="h-6 w-6" />
                </div>
                <span className="text-2xl font-serif font-normal tracking-tight text-primary">MenuQR</span>
              </div>
              <p className="text-muted-foreground font-medium">The nature-inspired future of hospitality dining.</p>
            </div>
            <div>
              <h4 className="mb-6 font-bold text-primary uppercase tracking-widest text-xs">Product</h4>
              <ul className="space-y-4 text-muted-foreground font-medium">
                <li className="hover:text-primary transition-colors cursor-pointer">Features</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Pricing</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Demo</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-6 font-bold text-primary uppercase tracking-widest text-xs">Support</h4>
              <ul className="space-y-4 text-muted-foreground font-medium">
                <li className="hover:text-primary transition-colors cursor-pointer">Documentation</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Contact</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Privacy</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-6 font-bold text-primary uppercase tracking-widest text-xs">Company</h4>
              <ul className="space-y-4 text-muted-foreground font-medium">
                <li className="hover:text-primary transition-colors cursor-pointer">Our Story</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Sustainability</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Careers</li>
              </ul>
            </div>
          </div>
          <div className="mt-20 border-t border-primary/5 pt-10 text-center text-sm text-muted-foreground font-medium">
            <p>© {new Date().getFullYear()} MenuQR Establishment. Crafted with care for hospitality.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

const FEATURES = [
  {
    title: "Organic QR Design",
    description: "Elegant, uniquely styled QR codes that complement your establishment's aesthetic.",
    icon: <QrCode className="h-6 w-6" />,
  },
  {
    title: "Lush Dashboard",
    description: "Manage items, prices, and seasonal specials with an intuitive, fresh interface.",
    icon: <LayoutDashboard className="h-6 w-6" />,
  },
  {
    title: "Eco-Friendly View",
    description: "A fast, sustainable digital experience optimized for every smartphone screen.",
    icon: <Smartphone className="h-6 w-6" />,
  },
  {
    title: "Zero-Friction",
    description: "Instant access via browser. No apps, no downloads, just fresh content.",
    icon: <CheckCircle className="h-6 w-6" />,
  },
]

const STEPS = [
  {
    title: "Plant Your Seed",
    description: "Create your profile and establish your digital presence in minutes.",
  },
  {
    title: "Grow Your Menu",
    description: "Add categories and high-quality photography to showcase your offerings.",
  },
  {
    title: "Share the Harvest",
    description: "Deploy your codes and watch your guest experience flourish.",
  },
]
