import { useEffect, useRef } from 'react'
import type { AttemptResponse, Question } from '../../types/quiz'
import { summarizeResponses } from '../../utils/questionState'
import { Button } from '../ui/Button'

type SubmissionSummaryProps = {
  open: boolean
  questions: Question[]
  responses: AttemptResponse[]
  submitting: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function SubmissionSummary({
  open,
  questions,
  responses,
  submitting,
  onCancel,
  onConfirm,
}: SubmissionSummaryProps) {
  const cancelRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    cancelRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) {
        onCancel()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onCancel, open, submitting])

  if (!open) {
    return null
  }

  const summary = summarizeResponses(questions, responses)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-dialog-title"
      aria-describedby="submit-dialog-description"
    >
      <div className="w-full max-w-md rounded-md bg-[var(--color-paper)] p-5 shadow-lg">
        <h2 id="submit-dialog-title" className="text-xl font-semibold">
          Submit test?
        </h2>
        <p id="submit-dialog-description" className="mt-2 text-sm text-[var(--color-muted)]">
          Please review your attempt summary before final submission.
        </p>
        <ul className="mt-4 space-y-1 text-sm">
          <li>Answered: {summary.answered}</li>
          <li>Not Answered: {summary.notAnswered}</li>
          <li>Marked for Review: {summary.marked}</li>
          <li>Not Visited: {summary.notVisited}</li>
          <li>Dropped: {summary.dropped}</li>
        </ul>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button
            ref={cancelRef}
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm} disabled={submitting}>
            {submitting ? 'Submitting…' : 'Confirm Submit'}
          </Button>
        </div>
      </div>
    </div>
  )
}
