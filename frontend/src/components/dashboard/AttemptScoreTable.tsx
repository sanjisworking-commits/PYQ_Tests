import { Link } from 'react-router-dom'
import type { DashboardAttempt } from '../../types/quiz'
import { formatDuration } from '../../utils/questionState'

type AttemptScoreTableProps = {
  attempts: DashboardAttempt[]
}

function shortId(attemptId: string): string {
  return attemptId.slice(0, 8)
}

function formatSubmittedAt(value: string | null): string {
  if (!value) {
    return '—'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  return date.toLocaleString()
}

export function AttemptScoreTable({ attempts }: AttemptScoreTableProps) {
  return (
    <div className="overflow-x-auto rounded-md border border-[var(--color-ink)]/10">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-[var(--color-accent)]/8 text-[var(--color-muted)]">
          <tr>
            <th className="px-3 py-2 font-medium">Attempt</th>
            <th className="px-3 py-2 font-medium">Score</th>
            <th className="px-3 py-2 font-medium">Correct</th>
            <th className="px-3 py-2 font-medium">Incorrect</th>
            <th className="px-3 py-2 font-medium">Unattempted</th>
            <th className="px-3 py-2 font-medium">Dropped</th>
            <th className="px-3 py-2 font-medium">Time</th>
            <th className="px-3 py-2 font-medium">Submitted</th>
            <th className="px-3 py-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {attempts.map((attempt) => (
            <tr
              key={attempt.attempt_id}
              className="border-t border-[var(--color-ink)]/10 bg-white/70"
            >
              <td className="px-3 py-2 font-mono text-xs">
                {shortId(attempt.attempt_id)}
              </td>
              <td className="px-3 py-2 font-medium">
                {attempt.score?.toFixed(2) ?? '—'} / {attempt.maximum_marks}
              </td>
              <td className="px-3 py-2">{attempt.correct_count ?? 0}</td>
              <td className="px-3 py-2">{attempt.incorrect_count ?? 0}</td>
              <td className="px-3 py-2">{attempt.unattempted_count ?? 0}</td>
              <td className="px-3 py-2">{attempt.dropped_count ?? 0}</td>
              <td className="px-3 py-2">
                {attempt.time_taken_seconds == null
                  ? '—'
                  : formatDuration(attempt.time_taken_seconds)}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                {formatSubmittedAt(attempt.submitted_at)}
              </td>
              <td className="px-3 py-2">
                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/results/${attempt.attempt_id}`}
                    className="text-[var(--color-accent)] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
                  >
                    Results
                  </Link>
                  <Link
                    to={`/review/${attempt.attempt_id}`}
                    className="text-[var(--color-accent)] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
                  >
                    Review
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
