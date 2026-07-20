import { useEffect, useState } from 'react'
import { fetchDashboardAttempts } from '../api/client'
import { AttemptScoreTable } from '../components/dashboard/AttemptScoreTable'
import { AppShell } from '../components/layout/AppShell'
import { PageHeader } from '../components/layout/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import type { DashboardResponse } from '../types/quiz'

export function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const payload = await fetchDashboardAttempts()
        if (!cancelled) {
          setData(payload)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setData(null)
          setError(err instanceof Error ? err.message : 'Failed to load dashboard')
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
        eyebrow="Personal"
        title="Scores Dashboard"
        description="Submitted attempt scores for each test on this machine."
      />

      {error ? <ErrorState message={error} /> : null}
      {!error && data === null ? (
        <LoadingState label="Loading scores…" />
      ) : null}

      {data && data.total_attempts === 0 ? (
        <EmptyState
          title="No attempts yet"
          message="Submit a test to see scores here."
        />
      ) : null}

      {data && data.total_attempts > 0 ? (
        <div className="space-y-5">
          <p className="text-base text-[var(--color-muted)]">
            {data.total_attempts} submitted attempt
            {data.total_attempts === 1 ? '' : 's'} across {data.tests.length}{' '}
            test{data.tests.length === 1 ? '' : 's'}
          </p>

          {data.tests.map((group) => (
            <section key={group.test_id} className="space-y-3">
              <div>
                <h2 className="text-xl font-semibold text-[var(--color-ink)]">
                  {group.year} — {group.paper}
                </h2>
                <p className="text-base text-[var(--color-muted)]">
                  {group.exam} · Series {group.series} · Max {group.maximum_marks}
                </p>
              </div>
              <AttemptScoreTable attempts={group.attempts} />
            </section>
          ))}
        </div>
      ) : null}
    </AppShell>
  )
}
