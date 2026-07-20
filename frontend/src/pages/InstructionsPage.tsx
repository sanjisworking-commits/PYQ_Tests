import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createAttempt, fetchTest } from '../api/client'
import { AppShell } from '../components/layout/AppShell'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import type { TestSummary } from '../types/quiz'
import { clearActiveAttempt, saveActiveAttempt } from '../utils/storage'

export function InstructionsPage() {
  const { year, slug } = useParams()
  const navigate = useNavigate()
  const [test, setTest] = useState<TestSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)

  const testId = year && slug ? `upsc-${year}-${slug}` : null

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!testId) {
        setError('Invalid test path')
        return
      }

      try {
        const data = await fetchTest(testId)
        if (!cancelled) {
          setTest(data)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setTest(null)
          setError(err instanceof Error ? err.message : 'Failed to load test')
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [testId])

  async function handleBeginTest() {
    if (!test || !testId) {
      return
    }

    setStarting(true)
    setError(null)
    try {
      clearActiveAttempt(testId)
      const attempt = await createAttempt(testId)
      saveActiveAttempt(testId, {
        attemptId: attempt.id,
        expiresAt: attempt.expires_at,
      })
      navigate(
        `/upsc/tests/${test.year}/${test.slug}/attempt?attemptId=${attempt.id}`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start attempt')
      setStarting(false)
    }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Instructions"
        title={test?.paper ?? 'Test instructions'}
        description="Read the rules carefully. The timer starts only after you begin."
      />

      <p className="mb-6 text-sm">
        <Link
          to={year ? `/upsc/tests/${year}` : '/upsc/tests'}
          className="text-[var(--color-accent)] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
        >
          ← Back to tests
        </Link>
      </p>

      {error ? <ErrorState message={error} /> : null}
      {!error && test === null ? (
        <LoadingState label="Loading instructions…" />
      ) : null}

      {test ? (
        <section className="max-w-3xl rounded-md border border-[var(--color-ink)]/10 bg-white/70 px-5 py-5">
          <p className="text-base text-[var(--color-muted)]">
            {test.exam} · {test.year} · Series {test.series}
          </p>
          <ul className="mt-4 space-y-2 text-[var(--color-ink)]/85">
            <li>Total questions: {test.total_questions}</li>
            <li>Duration: {test.duration_minutes} minutes</li>
            <li>Maximum marks: {test.maximum_marks}</li>
            <li>Correct answer: +{test.marks_per_correct}</li>
            <li>Incorrect answer: −{test.negative_marks}</li>
            <li>Unattempted: 0</li>
            <li>
              Dropped questions:{' '}
              {test.dropped_question_numbers.length > 0
                ? test.dropped_question_numbers.join(', ')
                : 'None'}{' '}
              (not included in scoring)
            </li>
            <li>Questions used for scoring: {test.questions_for_scoring}</li>
          </ul>
          <div className="mt-6 rounded-md bg-[var(--color-accent)]/5 px-4 py-3 text-base text-[var(--color-ink)]/80">
            Clicking Begin Test creates a timed attempt. Remaining time is restored
            from the server if you refresh.
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="button" onClick={() => void handleBeginTest()} disabled={starting}>
              {starting ? 'Starting…' : 'Begin Test'}
            </Button>
            <Button to={`/upsc/tests/${test.year}`} variant="secondary">
              Cancel
            </Button>
          </div>
        </section>
      ) : null}
    </AppShell>
  )
}
