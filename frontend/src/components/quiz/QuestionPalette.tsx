import type { AttemptResponse, Question, QuestionPaletteStatus } from '../../types/quiz'
import { getQuestionStatus } from '../../utils/questionState'

type QuestionPaletteProps = {
  questions: Question[]
  responses: AttemptResponse[]
  currentNumber: number
  onJump: (questionNumber: number) => void
}

const statusClasses: Record<QuestionPaletteStatus, string> = {
  not_visited: 'bg-slate-200 text-slate-800',
  not_answered: 'bg-red-500 text-white',
  answered: 'bg-emerald-600 text-white',
  marked_for_review: 'bg-violet-600 text-white',
  answered_marked_for_review: 'bg-violet-600 text-white ring-2 ring-emerald-300',
  dropped: 'bg-amber-200 text-amber-950',
}

const legend: Array<{ status: QuestionPaletteStatus; label: string }> = [
  { status: 'not_visited', label: 'Not Visited' },
  { status: 'not_answered', label: 'Not Answered' },
  { status: 'answered', label: 'Answered' },
  { status: 'marked_for_review', label: 'Marked for Review' },
  { status: 'answered_marked_for_review', label: 'Answered + Marked' },
  { status: 'dropped', label: 'Dropped' },
]

export function QuestionPalette({
  questions,
  responses,
  currentNumber,
  onJump,
}: QuestionPaletteProps) {
  const byNumber = new Map(
    responses.map((response) => [response.question_number, response]),
  )

  return (
    <aside className="rounded-md border border-[var(--color-ink)]/10 bg-white/80 p-4">
      <h2 className="text-sm font-semibold tracking-wide uppercase">Question Palette</h2>
      <div className="mt-3 grid grid-cols-5 gap-2">
        {questions.map((question) => {
          const status = getQuestionStatus(question, byNumber.get(question.number))
          const isCurrent = question.number === currentNumber
          return (
            <button
              key={question.number}
              type="button"
              onClick={() => onJump(question.number)}
              className={[
                'h-9 rounded text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]',
                statusClasses[status],
                isCurrent ? 'ring-2 ring-offset-1 ring-[var(--color-ink)]' : '',
              ].join(' ')}
              aria-label={`Question ${question.number}, ${status.replaceAll('_', ' ')}`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {question.number}
            </button>
          )
        })}
      </div>

      <ul className="mt-4 space-y-2 text-xs text-[var(--color-muted)]">
        {legend.map((item) => (
          <li key={item.status} className="flex items-center gap-2">
            <span className={`inline-block size-3 rounded-sm ${statusClasses[item.status]}`} />
            {item.label}
          </li>
        ))}
      </ul>
    </aside>
  )
}
