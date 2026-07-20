import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchAttempt, fetchTest } from '../api/client'
import { AppShell } from '../components/layout/AppShell'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import type { Attempt, TestSummary } from '../types/quiz'
import { formatTimeTaken } from '../utils/questionState'

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
        description="Final score and attempt summary for this submission."
      />

      {error ? <ErrorState message={error} /> : null}
      {!error && (!attempt || !test) ? (
        <LoadingState label="Loading results…" />
      ) : null}

      {attempt && test ? (
        <section className="max-w-3xl rounded-md border border-[var(--color-ink)]/10 bg-white/70 px-5 py-5">
          <p className="text-base text-[var(--color-muted)]">
            {test.exam} · {test.year} · Series {test.series}
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-md bg-[var(--color-accent)]/8 px-4 py-4">
              <p className="text-xs tracking-[0.14em] text-[var(--color-muted)] uppercase">
                Final score
              </p>
              <p className="mt-1 text-3xl font-semibold text-[var(--color-accent)]">
                {attempt.score?.toFixed(2) ?? '—'}
              </p>
            </div>
            <div className="rounded-md bg-white/80 px-4 py-4">
              <p className="text-xs tracking-[0.14em] text-[var(--color-muted)] uppercase">
                Official maximum marks
              </p>
              <p className="mt-1 text-3xl font-semibold text-[var(--color-ink)]">
                {attempt.maximum_marks}
              </p>
            </div>
          </div>

          <dl className="mt-6 grid gap-3 text-base sm:grid-cols-2">
            <div>
              <dt className="text-[var(--color-muted)]">Correct answers</dt>
              <dd className="font-medium">{attempt.correct_count ?? 0}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-muted)]">Incorrect answers</dt>
              <dd className="font-medium">{attempt.incorrect_count ?? 0}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-muted)]">Unattempted questions</dt>
              <dd className="font-medium">{attempt.unattempted_count ?? 0}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-muted)]">Dropped questions</dt>
              <dd className="font-medium">{attempt.dropped_count ?? 0}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-muted)]">Accuracy</dt>
              <dd className="font-medium">
                {attempt.accuracy == null
                  ? '0%'
                  : `${(attempt.accuracy * 100).toFixed(1)}%`}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--color-muted)]">Time taken</dt>
              <dd className="font-medium">
                {formatTimeTaken(attempt.started_at, attempt.submitted_at)}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-[var(--color-muted)]">Submission status</dt>
              <dd className="font-medium capitalize">
                {attempt.status.replaceAll('_', ' ')}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button to={`/review/${attempt.id}`}>Review Answers</Button>
            <Button to={`/upsc/tests/${test.year}`} variant="secondary">
              Return to Tests
            </Button>
          </div>
        </section>
      ) : null}

      <p className="mt-6 text-sm">
        <Link
          to="/upsc/tests"
          className="text-[var(--color-accent)] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
        >
          ← Attempt Tests
        </Link>
      </p>
    </AppShell>
  )
}
