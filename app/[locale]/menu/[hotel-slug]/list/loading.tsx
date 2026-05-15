import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen bg-linear-to-b from-background via-background to-secondary/10">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur">
          <div className="h-5 w-40 animate-pulse rounded-full bg-muted" />
          <div className="mt-4 h-11 w-full animate-pulse rounded-2xl bg-muted" />
          <div className="mt-4 flex gap-2 overflow-hidden">
            <div className="h-9 w-24 animate-pulse rounded-xl bg-muted" />
            <div className="h-9 w-20 animate-pulse rounded-xl bg-muted" />
            <div className="h-9 w-28 animate-pulse rounded-xl bg-muted" />
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3"
            >
              <div className="h-16 w-16 animate-pulse rounded-xl bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-3 w-full animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-4 w-16 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs font-semibold uppercase tracking-[0.18em]">Curating menu experience</span>
        </div>
      </div>
    </div>
  )
}
