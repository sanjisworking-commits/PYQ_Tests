import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchAttempt, fetchTest } from '../api/client'
import { AppShell } from '../components/layout/AppShell'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import type { Attempt, TestSummary } from '../types/quiz'

export function ResultsPage() {
  const { attemptId } = useParams()
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [test, setTest] = useState<TestSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!attemptId) {
        setError('Missing attempt id')
        return
      }

      try {
        const attemptData = await fetchAttempt(attemptId)
        if (attemptData.status === 'in_progress') {
          throw new Error('This attempt has not been submitted yet.')
        }
        const testData = await fetchTest(attemptData.test_id)
        if (!cancelled) {
          setAttempt(attemptData)
          setTest(testData)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load results')
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [attemptId])

  return (
    <AppShell>
      <PageHeader
        eyebrow="Results"
        title={test?.paper ?? 'Attempt results'}
        description="Your submission has been scored."
      />

      {error ? <ErrorState message={error} /> : null}
      {!error && (!attempt || !test) ? <LoadingState label="Loading results…" /> : null}

      {attempt && test ? (
        <section className="max-w-xl rounded-md border border-[var(--color-ink)]/10 bg-white/70 px-5 py-6">
          <p className="text-sm text-[var(--color-muted)]">
            {test.exam} · {test.year} · Series {test.series}
          </p>
          <p className="mt-4 text-3xl font-semibold text-[var(--color-accent)]">
            {attempt.score?.toFixed(2) ?? '—'} / {attempt.maximum_marks}
          </p>
          <ul className="mt-4 space-y-1 text-sm text-[var(--color-ink)]/85">
            <li>Status: {attempt.status.replaceAll('_', ' ')}</li>
            <li>Correct: {attempt.correct_count ?? 0}</li>
            <li>Incorrect: {attempt.incorrect_count ?? 0}</li>
            <li>Unattempted: {attempt.unattempted_count ?? 0}</li>
            <li>Dropped: {attempt.dropped_count ?? 0}</li>
            <li>
              Accuracy:{' '}
              {attempt.accuracy == null
                ? '—'
                : `${(attempt.accuracy * 100).toFixed(1)}%`}
            </li>
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button to={`/upsc/tests/${test.year}`}>Return to Tests</Button>
          </div>
          <p className="mt-4 text-xs text-[var(--color-muted)]">
            Answer review arrives in Sprint 6.
          </p>
        </section>
      ) : null}

      {!attempt && !error ? null : (
        <p className="mt-6 text-sm">
          <Link
            to="/upsc/tests"
            className="text-[var(--color-accent)] underline-offset-2 hover:underline"
          >
            ← Attempt Tests
          </Link>
        </p>
      )}
    </AppShell>
  )
}
