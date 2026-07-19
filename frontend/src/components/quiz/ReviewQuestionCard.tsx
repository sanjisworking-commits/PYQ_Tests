import type { ReviewQuestion } from '../../types/quiz'
import { getReviewVerdict } from '../../utils/questionState'
import { MatchingLists } from './MatchingLists'
import { MatchingPairs } from './MatchingPairs'
import { QuestionNotesEditor } from './QuestionNotesEditor'
import { QuestionTable } from './QuestionTable'
import { SourceExplanationPanel } from './SourceExplanationPanel'
import { StatementList } from './StatementList'
import { StudyRefsList } from './StudyRefsList'

type ReviewQuestionCardProps = {
  question: ReviewQuestion
  noteBody: string
  onSaveNote: (body: string) => Promise<void>
}

const verdictStyles = {
  correct: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  incorrect: 'border-red-300 bg-red-50 text-red-900',
  unattempted: 'border-slate-300 bg-slate-50 text-slate-800',
  dropped: 'border-amber-300 bg-amber-50 text-amber-950',
} as const

const verdictLabels = {
  correct: 'Correct',
  incorrect: 'Incorrect',
  unattempted: 'Unattempted',
  dropped: 'Dropped',
} as const

export function ReviewQuestionCard({
  question,
  noteBody,
  onSaveNote,
}: ReviewQuestionCardProps) {
  const verdict = getReviewVerdict(question)

  return (
    <article className="rounded-md border border-[var(--color-ink)]/10 bg-white/75 p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold">Question {question.number}</h2>
        <span
          className={`rounded px-2 py-0.5 text-xs font-medium tracking-wide uppercase ${verdictStyles[verdict]}`}
        >
          {verdictLabels[verdict]}
        </span>
      </div>

      {question.is_dropped ? (
        <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Dropped Question — Not included in scoring.
        </div>
      ) : null}

      {question.case_text ? (
        <p className="mb-3 whitespace-pre-wrap text-sm leading-relaxed">
          {question.case_text}
        </p>
      ) : null}

      <p className="whitespace-pre-wrap text-base leading-relaxed">{question.stem}</p>
      <StatementList statements={question.statements} />
      <MatchingPairs pairs={question.pairs} />
      {question.lists ? <MatchingLists lists={question.lists} /> : null}
      {question.table ? <QuestionTable table={question.table} /> : null}

      <ul className="mt-4 space-y-2">
        {question.options.map((option) => {
          const isSelected = question.selected_option === option.label
          const isCorrect = question.correct_option === option.label
          return (
            <li
              key={option.label}
              className={[
                'rounded-md border px-3 py-2 text-sm',
                isCorrect
                  ? 'border-emerald-400 bg-emerald-50'
                  : isSelected
                    ? 'border-red-300 bg-red-50'
                    : 'border-[var(--color-ink)]/10 bg-white/60',
              ].join(' ')}
            >
              <span className="font-semibold">{option.label}.</span> {option.text}
              {isCorrect ? (
                <span className="ml-2 text-xs font-medium text-emerald-800">
                  Correct answer
                </span>
              ) : null}
              {isSelected && !isCorrect && !question.is_dropped ? (
                <span className="ml-2 text-xs font-medium text-red-800">
                  Your answer
                </span>
              ) : null}
              {isSelected && isCorrect ? (
                <span className="ml-2 text-xs font-medium text-emerald-800">
                  Your answer
                </span>
              ) : null}
            </li>
          )
        })}
      </ul>

      {!question.is_dropped ? (
        <p className="mt-3 text-sm text-[var(--color-muted)]">
          Your answer: {question.selected_option ?? 'Not answered'} · Correct
          answer: {question.correct_option ?? '—'}
        </p>
      ) : null}

      <StudyRefsList refs={question.study_refs ?? []} />
      <SourceExplanationPanel
        explanations={question.explanations ?? []}
        officialAnswer={question.correct_option}
      />
      <QuestionNotesEditor
        questionNumber={question.number}
        initialBody={noteBody}
        onSave={onSaveNote}
      />
    </article>
  )
}
