import { AppShell } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'

export function HomePage() {
  return (
    <AppShell>
      <section className="flex min-h-[70vh] flex-col justify-center">
        <p className="mb-3 text-xs tracking-[0.2em] text-[var(--color-muted)] uppercase">
          Personal practice
        </p>
        <h1 className="max-w-xl text-5xl leading-tight font-semibold text-[var(--color-accent)] sm:text-6xl">
          PYQ
        </h1>
        <p className="mt-2 text-2xl text-[var(--color-ink)] sm:text-3xl">
          UPSC Civil Services Examination
        </p>
        <p className="mt-4 max-w-xl text-base text-[var(--color-ink)]/75">
          Attempt previous-year papers with timed practice, scoring, and review —
          starting with GS Paper I 2026.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button to="/upsc/tests">Attempt Tests</Button>
          <Button to="/upsc" variant="secondary">
            About UPSC section
          </Button>
        </div>
      </section>
    </AppShell>
  )
}
