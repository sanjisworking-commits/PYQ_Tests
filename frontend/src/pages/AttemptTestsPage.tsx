import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchUpscYears } from '../api/client'
import { AppShell } from '../components/layout/AppShell'
import { PageHeader } from '../components/layout/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import type { YearSummary } from '../types/quiz'

export function AttemptTestsPage() {
  const [years, setYears] = useState<YearSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await fetchUpscYears()
        if (!cancelled) {
          setYears(data)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setYears(null)
          setError(err instanceof Error ? err.message : 'Failed to load years')
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <AppShell>
      <PageHeader
        eyebrow="UPSC"
        title="Attempt UPSC Tests"
        description="Choose a year to see available papers."
      />

      {error ? <ErrorState message={error} /> : null}
      {!error && years === null ? <LoadingState label="Loading years…" /> : null}
      {!error && years && years.length === 0 ? (
        <EmptyState
          title="No years listed"
          message="Year metadata has not been configured yet."
        />
      ) : null}

      {years && years.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {years.map((item) => {
            const available = item.status === 'available'
            const content = (
              <>
                <span className="text-2xl font-semibold">{item.year}</span>
                <span className="text-sm text-[var(--color-muted)]">
                  {available ? 'Available' : 'Coming Soon'}
                </span>
              </>
            )

            if (!available) {
              return (
                <li key={item.year}>
                  <div
                    aria-disabled="true"
                    className="flex min-h-28 flex-col justify-between rounded-md border border-[var(--color-ink)]/10 bg-white/40 px-5 py-4 opacity-60"
                  >
                    {content}
                  </div>
                </li>
              )
            }

            return (
              <li key={item.year}>
                <Link
                  to={`/upsc/tests/${item.year}`}
                  className="flex min-h-28 flex-col justify-between rounded-md border border-[var(--color-accent)]/25 bg-white/70 px-5 py-4 transition hover:border-[var(--color-accent)]/50 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
                >
                  {content}
                </Link>
              </li>
            )
          })}
        </ul>
      ) : null}
    </AppShell>
  )
}
