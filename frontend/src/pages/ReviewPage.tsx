import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  fetchAttemptReview,
  fetchTest,
  fetchTestNotes,
  saveQuestionNote,
} from '../api/client'
import { AppShell } from '../components/layout/AppShell'
import { PageHeader } from '../components/layout/PageHeader'
import { ReviewQuestionCard } from '../components/quiz/ReviewQuestionCard'
import { Button } from '../components/ui/Button'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import type { AttemptReview, QuestionNote, TestSummary } from '../types/quiz'
import { getReviewVerdict } from '../utils/questionState'

type Filter = 'all' | 'correct' | 'incorrect' | 'unattempted' | 'dropped'

export function ReviewPage() {
  const { attemptId } = useParams()
  const [review, setReview] = useState<AttemptReview | null>(null)
  const [test, setTest] = useState<TestSummary | null>(null)
  const [notesByNumber, setNotesByNumber] = useState<Record<number, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!attemptId) {
        setError('Missing attempt id')
        return
      }

      try {
        const reviewData = await fetchAttemptReview(attemptId)
        const [testData, notes] = await Promise.all([
          fetchTest(reviewData.attempt.test_id),
          fetchTestNotes(reviewData.attempt.test_id),
        ])
        if (!cancelled) {
          setReview(reviewData)
          setTest(testData)
          setNotesByNumber(mapNotes(notes))
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load review')
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [attemptId])

  const filteredQuestions = useMemo(() => {
    if (!review) {
      return []
    }
    if (filter === 'all') {
      return review.questions
    }
    return review.questions.filter(
      (question) => getReviewVerdict(question) === filter,
    )
  }, [filter, review])

  const handleSaveNote = useCallback(
    async (questionNumber: number, body: string) => {
      if (!review) {
        return
      }
      const saved = await saveQuestionNote(
        review.attempt.test_id,
        questionNumber,
        body,
      )
      setNotesByNumber((prev) => ({
        ...prev,
        [saved.question_number]: saved.body,
      }))
    },
    [review],
  )

  return (
    <AppShell>
      <PageHeader
        eyebrow="Answer review"
        title={test?.paper ?? 'Review answers'}
        description="Correct answers, syllabus map, coaching analysis, and your notes — after submission."
      />

      {error ? <ErrorState message={error} /> : null}
      {!error && (!review || !test) ? (
        <LoadingState label="Loading answer review…" />
      ) : null}

      {review && test ? (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[var(--color-muted)]">
              Score: {review.attempt.score?.toFixed(2) ?? '—'} /{' '}
              {review.attempt.maximum_marks}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button to={`/results/${review.attempt.id}`} variant="secondary">
                Back to Results
              </Button>
              <Button to={`/upsc/tests/${test.year}`} variant="ghost">
                Return to Tests
              </Button>
            </div>
          </div>

          <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Filter questions">
            {(
              [
                ['all', 'All'],
                ['correct', 'Correct'],
                ['incorrect', 'Incorrect'],
                ['unattempted', 'Unattempted'],
                ['dropped', 'Dropped'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={[
                  'rounded-md px-3 py-1.5 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]',
                  filter === value
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'bg-white/70 text-[var(--color-ink)] hover:bg-white',
                ].join(' ')}
                aria-pressed={filter === value}
              >
                {label}
              </button>
            ))}
          </div>

          {filteredQuestions.length === 0 ? (
            <p className="rounded-md border border-dashed border-[var(--color-ink)]/20 px-4 py-6 text-sm text-[var(--color-muted)]">
              No questions in this filter.
            </p>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.map((question) => (
                <ReviewQuestionCard
                  key={question.number}
                  question={question}
                  noteBody={notesByNumber[question.number] ?? ''}
                  onSaveNote={(body) => handleSaveNote(question.number, body)}
                />
              ))}
            </div>
          )}
        </>
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

function mapNotes(notes: QuestionNote[]): Record<number, string> {
  const mapped: Record<number, string> = {}
  for (const note of notes) {
    mapped[note.question_number] = note.body
  }
  return mapped
}
