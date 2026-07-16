import type { Question } from '../../types/quiz'
import type { AttemptResponse } from '../../types/quiz'
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
    >
      <div className="w-full max-w-md rounded-md bg-[var(--color-paper)] p-5 shadow-lg">
        <h2 id="submit-dialog-title" className="text-xl font-semibold">
          Submit test?
        </h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
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
          <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
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
