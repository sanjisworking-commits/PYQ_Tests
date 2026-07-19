import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  fetchAttempt,
  fetchTestDetail,
  patchAttemptResponses,
  submitAttempt,
} from '../api/client'
import { QuestionPalette } from '../components/quiz/QuestionPalette'
import { QuestionRenderer } from '../components/quiz/QuestionRenderer'
import { SubmissionSummary } from '../components/quiz/SubmissionSummary'
import { Timer } from '../components/quiz/Timer'
import { Button } from '../components/ui/Button'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { useTimer } from '../hooks/useTimer'
import type { Attempt, AttemptResponse, TestDetail } from '../types/quiz'
import {
  clearActiveAttempt,
  loadActiveAttempt,
  saveActiveAttempt,
} from '../utils/storage'

export function AttemptPage() {
  const { year, slug } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const testId = year && slug ? `upsc-${year}-${slug}` : null
  const queryAttemptId = searchParams.get('attemptId')

  const [test, setTest] = useState<TestDetail | null>(null)
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitOpen, setSubmitOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)

  const autoSubmitLock = useRef(false)

  const responseMap = useMemo(() => {
    const map = new Map<number, AttemptResponse>()
    for (const response of attempt?.responses ?? []) {
      map.set(response.question_number, response)
    }
    return map
  }, [attempt])

  const currentQuestion = test?.questions[currentIndex]

  const finishAttempt = useCallback(
    async (auto: boolean) => {
      if (!attempt || autoSubmitLock.current) {
        return
      }
      autoSubmitLock.current = true
      setSubmitting(true)
      try {
        const submitted = await submitAttempt(attempt.id)
        if (testId) {
          clearActiveAttempt(testId)
        }
        setAttempt(submitted)
        navigate(`/results/${submitted.id}`, { replace: true })
      } catch (err) {
        autoSubmitLock.current = false
        setError(err instanceof Error ? err.message : 'Failed to submit attempt')
        setSubmitting(false)
        if (!auto) {
          setSubmitOpen(false)
        }
      }
    },
    [attempt, navigate, testId],
  )

  const handleExpire = useCallback(() => {
    void finishAttempt(true)
  }, [finishAttempt])

  const timerEnabled =
    !loading && attempt?.status === 'in_progress' && Boolean(attempt?.expires_at)

  const { remainingSeconds, isWarning } = useTimer(
    timerEnabled && attempt ? attempt.expires_at : null,
    handleExpire,
    timerEnabled,
  )

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      if (!testId) {
        setError('Invalid test path')
        setLoading(false)
        return
      }

      try {
        const stored = loadActiveAttempt(testId)
        const attemptId = queryAttemptId ?? stored?.attemptId
        if (!attemptId) {
          setError('No active attempt found. Start from the instructions page.')
          setLoading(false)
          return
        }

        const [testDetail, attemptDetail] = await Promise.all([
          fetchTestDetail(testId),
          fetchAttempt(attemptId),
        ])

        if (cancelled) {
          return
        }

        if (attemptDetail.test_id !== testId) {
          setError('This attempt does not belong to the selected test.')
          setLoading(false)
          return
        }

        // Paper data may have been replaced (e.g. sample → full 100Q).
        // Old attempts cannot be resumed against a different question set.
        if (
          attemptDetail.responses.length !== testDetail.questions.length
        ) {
          clearActiveAttempt(testId)
          setError(
            'This attempt was started with an older question set. Go back to Instructions and click Begin Test to start a fresh attempt.',
          )
          setLoading(false)
          return
        }

        saveActiveAttempt(testId, {
          attemptId: attemptDetail.id,
          expiresAt: attemptDetail.expires_at,
        })

        setTest(testDetail)
        setAttempt(attemptDetail)

        if (attemptDetail.status !== 'in_progress') {
          clearActiveAttempt(testId)
          navigate(`/results/${attemptDetail.id}`, { replace: true })
          return
        }

        const firstUnvisited = testDetail.questions.findIndex((question) => {
          const response = attemptDetail.responses.find(
            (item) => item.question_number === question.number,
          )
          return !response?.is_visited && !question.is_dropped
        })
        setCurrentIndex(firstUnvisited >= 0 ? firstUnvisited : 0)
        setError(null)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load attempt')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [navigate, queryAttemptId, testId])

  useEffect(() => {
    document.body.classList.toggle('palette-open', paletteOpen)
    return () => {
      document.body.classList.remove('palette-open')
    }
  }, [paletteOpen])

  useEffect(() => {
    if (!test || !attempt || attempt.status !== 'in_progress') {
      return
    }

    const question = test.questions[currentIndex]
    if (!question) {
      return
    }

    const existing = responseMap.get(question.number)
    if (existing?.is_visited || question.is_dropped) {
      return
    }

    let cancelled = false

    async function markVisited() {
      if (!attempt) {
        return
      }
      const attemptId = attempt.id
      setSaving(true)
      try {
        const updated = await patchAttemptResponses(attemptId, [
          {
            question_number: question.number,
            is_visited: true,
          },
        ])
        if (!cancelled) {
          setAttempt(updated)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to save progress')
        }
      } finally {
        if (!cancelled) {
          setSaving(false)
        }
      }
    }

    void markVisited()
    return () => {
      cancelled = true
    }
  }, [attempt, currentIndex, responseMap, test])

  async function persist(
    updates: Parameters<typeof patchAttemptResponses>[1],
  ): Promise<Attempt | null> {
    if (!attempt) {
      return null
    }
    setSaving(true)
    try {
      const updated = await patchAttemptResponses(attempt.id, updates)
      setAttempt(updated)
      setError(null)
      return updated
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save response')
      return null
    } finally {
      setSaving(false)
    }
  }

  async function handleSelectOption(label: string) {
    if (!currentQuestion || currentQuestion.is_dropped) {
      return
    }
    await persist([
      {
        question_number: currentQuestion.number,
        selected_option: label,
        is_visited: true,
      },
    ])
  }

  async function handleClear() {
    if (!currentQuestion || currentQuestion.is_dropped) {
      return
    }
    await persist([
      {
        question_number: currentQuestion.number,
        selected_option: null,
        is_visited: true,
      },
    ])
  }

  async function handleMarkForReview() {
    if (!currentQuestion || currentQuestion.is_dropped) {
      return
    }
    const current = responseMap.get(currentQuestion.number)
    await persist([
      {
        question_number: currentQuestion.number,
        is_marked_for_review: !current?.is_marked_for_review,
        is_visited: true,
      },
    ])
  }

  async function handleSaveAndNext() {
    if (!test || !currentQuestion) {
      return
    }
    await persist([
      {
        question_number: currentQuestion.number,
        is_visited: true,
      },
    ])
    if (currentIndex < test.questions.length - 1) {
      setCurrentIndex((value) => value + 1)
    }
  }

  function handleJump(questionNumber: number) {
    if (!test) {
      return
    }
    const index = test.questions.findIndex((item) => item.number === questionNumber)
    if (index >= 0) {
      setCurrentIndex(index)
      setPaletteOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <LoadingState label="Loading attempt…" />
      </div>
    )
  }

  if (error && (!test || !attempt)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <ErrorState message={error} />
        <div className="mt-4">
          <Button to={year && slug ? `/upsc/tests/${year}/${slug}/instructions` : '/upsc/tests'}>
            Back to instructions
          </Button>
        </div>
      </div>
    )
  }

  if (!test || !attempt || !currentQuestion) {
    return null
  }

  const marked = Boolean(responseMap.get(currentQuestion.number)?.is_marked_for_review)

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8f4ee_0%,#f5f0e8_100%)]">
      <a href="#attempt-main" className="skip-link">
        Skip to question
      </a>
      <header className="sticky top-0 z-20 border-b border-[var(--color-ink)]/10 bg-[rgba(248,244,238,0.95)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs tracking-[0.16em] text-[var(--color-muted)] uppercase">
              {test.exam}
            </p>
            <h1 className="truncate text-lg font-semibold text-[var(--color-ink)] sm:text-xl">
              {test.paper}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Timer remainingSeconds={remainingSeconds} isWarning={isWarning} />
            <Button
              type="button"
              variant="secondary"
              className="lg:hidden"
              aria-expanded={paletteOpen}
              aria-controls="question-palette-panel"
              onClick={() => setPaletteOpen((value) => !value)}
            >
              {paletteOpen ? 'Close Palette' : 'Palette'}
            </Button>
            <Button type="button" onClick={() => setSubmitOpen(true)} disabled={submitting}>
              Submit
            </Button>
          </div>
        </div>
        {isWarning ? (
          <p className="bg-red-100 px-4 py-1 text-center text-xs font-medium text-red-800" aria-live="assertive">
            Less than 10 minutes remaining.
          </p>
        ) : null}
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-4 pb-28 lg:grid-cols-[minmax(0,1fr)_280px] lg:pb-4">
        <main
          id="attempt-main"
          className="rounded-md border border-[var(--color-ink)]/10 bg-white/75 p-4 sm:p-6"
        >
          {error ? (
            <div className="mb-4">
              <ErrorState message={error} />
            </div>
          ) : null}

          <QuestionRenderer
            question={currentQuestion}
            response={responseMap.get(currentQuestion.number)}
            onSelectOption={(label) => {
              void handleSelectOption(label)
            }}
          />

          <div className="mt-6 hidden flex-wrap gap-2 border-t border-[var(--color-ink)]/10 pt-4 lg:flex">
            <Button
              type="button"
              variant="secondary"
              disabled={currentIndex === 0 || saving}
              onClick={() => setCurrentIndex((value) => Math.max(0, value - 1))}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={currentQuestion.is_dropped || saving}
              onClick={() => {
                void handleClear()
              }}
            >
              Clear Response
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={currentQuestion.is_dropped || saving}
              onClick={() => {
                void handleMarkForReview()
              }}
            >
              {marked ? 'Unmark Review' : 'Mark for Review'}
            </Button>
            <Button
              type="button"
              disabled={saving}
              onClick={() => {
                void handleSaveAndNext()
              }}
            >
              Save & Next
            </Button>
          </div>
          {saving ? (
            <p className="mt-3 text-xs text-[var(--color-muted)]" aria-live="polite">
              Saving…
            </p>
          ) : null}
        </main>

        <div className="hidden lg:block">
          <QuestionPalette
            questions={test.questions}
            responses={attempt.responses}
            currentNumber={currentQuestion.number}
            onJump={handleJump}
          />
        </div>
      </div>

      {paletteOpen ? (
        <div className="fixed inset-0 z-30 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close question palette"
            onClick={() => setPaletteOpen(false)}
          />
          <div
            id="question-palette-panel"
            className="absolute inset-x-0 bottom-0 max-h-[75vh] overflow-y-auto rounded-t-lg bg-[var(--color-paper)] p-4 shadow-xl"
          >
            <QuestionPalette
              questions={test.questions}
              responses={attempt.responses}
              currentNumber={currentQuestion.number}
              onJump={handleJump}
            />
          </div>
        </div>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--color-ink)]/10 bg-[rgba(248,244,238,0.97)] px-3 py-3 lg:hidden">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={currentIndex === 0 || saving}
            onClick={() => setCurrentIndex((value) => Math.max(0, value - 1))}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={currentQuestion.is_dropped || saving}
            onClick={() => {
              void handleClear()
            }}
          >
            Clear
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={currentQuestion.is_dropped || saving}
            onClick={() => {
              void handleMarkForReview()
            }}
          >
            {marked ? 'Unmark' : 'Mark'}
          </Button>
          <Button
            type="button"
            disabled={saving}
            onClick={() => {
              void handleSaveAndNext()
            }}
          >
            Save & Next
          </Button>
        </div>
      </div>

      <SubmissionSummary
        open={submitOpen}
        questions={test.questions}
        responses={attempt.responses}
        submitting={submitting}
        onCancel={() => setSubmitOpen(false)}
        onConfirm={() => {
          void finishAttempt(false)
        }}
      />
    </div>
  )
}
