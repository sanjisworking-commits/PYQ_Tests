import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchUpscTestsForYear } from '../api/client'
import { AppShell } from '../components/layout/AppShell'
import { PageHeader } from '../components/layout/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import type { TestSummary } from '../types/quiz'

export function YearTestsPage() {
  const { year: yearParam } = useParams()
  const year = Number(yearParam)
  const [tests, setTests] = useState<TestSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!Number.isFinite(year)) {
        setError('Invalid year')
        setTests([])
        return
      }

      try {
        const data = await fetchUpscTestsForYear(year)
        if (!cancelled) {
          setTests(data)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setTests(null)
          setError(err instanceof Error ? err.message : 'Failed to load tests')
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [year])

  return (
    <AppShell>
      <PageHeader
        eyebrow="Attempt Tests"
        title={`${Number.isFinite(year) ? year : '—'} Tests`}
        description="Select a paper to review instructions before starting."
      />

      <p className="mb-6 text-sm">
        <Link
          to="/upsc/tests"
          className="text-[var(--color-accent)] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
        >
          ← Back to years
        </Link>
      </p>

      {error ? <ErrorState message={error} /> : null}
      {!error && tests === null ? <LoadingState label="Loading tests…" /> : null}
      {!error && tests && tests.length === 0 ? (
        <EmptyState
          title="No tests for this year"
          message="Papers for this year have not been added yet."
        />
      ) : null}

      {tests && tests.length > 0 ? (
        <ul className="space-y-4">
          {tests.map((test) => (
            <li
              key={test.id}
              className="rounded-md border border-[var(--color-ink)]/10 bg-white/70 px-5 py-5"
            >
              <h2 className="text-xl font-semibold text-[var(--color-ink)]">
                {test.paper}
              </h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Series {test.series} · {test.exam}
              </p>
              <ul className="mt-4 grid gap-1 text-sm text-[var(--color-ink)]/80 sm:grid-cols-2">
                <li>{test.total_questions} Questions</li>
                <li>{test.duration_minutes} Minutes</li>
                <li>Maximum Marks: {test.maximum_marks}</li>
                <li>Negative marking: One-third</li>
                <li>
                  {test.dropped_question_numbers.length} dropped question
                  {test.dropped_question_numbers.length === 1 ? '' : 's'}
                </li>
                <li>{test.questions_for_scoring} questions used for scoring</li>
              </ul>
              <div className="mt-5">
                <Link
                  to={`/upsc/tests/${test.year}/${test.slug}/instructions`}
                  className="inline-flex items-center justify-center rounded-md bg-[var(--color-accent)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#0c3d4a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
                >
                  Start Test
                </Link>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </AppShell>
  )
}
