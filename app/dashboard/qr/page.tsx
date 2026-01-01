import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { QrCode, Download, Printer, Copy, ExternalLink, Smartphone } from "lucide-react"
import { MOCK_HOTEL } from "@/lib/mock-data"
import Link from "next/link"

export default function QRPage() {
  const menuUrl = `https://menuqr.app/menu/${MOCK_HOTEL.slug}`

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">QR Code</h1>
          <p className="text-muted-foreground">Your portal to a contactless guest experience.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="flex flex-col items-center justify-center p-8 text-center bg-background border-2">
          <div className="relative mb-6 rounded-2xl bg-white p-6 shadow-xl">
            <QrCode className="h-48 w-48 text-black" strokeWidth={1.5} />
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <QrCode className="h-full w-full" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold">{MOCK_HOTEL.name}</h3>
            <p className="text-sm text-muted-foreground">Scan to view digital menu</p>
          </div>
          <div className="mt-8 flex w-full gap-3">
            <Button className="flex-1 gap-2">
              <Download className="h-4 w-4" /> Download
            </Button>
            <Button variant="outline" className="flex-1 gap-2 bg-transparent">
              <Printer className="h-4 w-4" /> Print
            </Button>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Menu Link</CardTitle>
              <CardDescription>The direct URL that your QR code points to.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
                <span className="flex-1 truncate text-sm font-mono">{menuUrl}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="link" className="h-auto p-0 text-primary" asChild>
                <Link href={`/menu/${MOCK_HOTEL.slug}`} target="_blank" className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" /> Open live menu
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" /> Display Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  Place QR codes in high-visibility areas like table tents or entrance posters.
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  Ensure the QR code is at least 2cm x 2cm for easy scanning.
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  Test the code with different lighting conditions before printing.
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
