import type { AttemptResponse, Question } from '../../types/quiz'
import { MatchingLists } from './MatchingLists'
import { MatchingPairs } from './MatchingPairs'
import { OptionList } from './OptionList'
import { QuestionTable } from './QuestionTable'
import { StatementList } from './StatementList'

type QuestionRendererProps = {
  question: Question
  response: AttemptResponse | undefined
  onSelectOption: (label: string) => void
}

export function QuestionRenderer({
  question,
  response,
  onSelectOption,
}: QuestionRendererProps) {
  return (
    <article>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold">Question {question.number}</h2>
        <span className="rounded bg-[var(--color-ink)]/5 px-2 py-0.5 text-xs tracking-wide text-[var(--color-muted)] uppercase">
          {question.type.replaceAll('_', ' ')}
        </span>
      </div>

      {question.is_dropped ? (
        <div
          className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-base text-amber-950"
          role="status"
        >
          Dropped Question — Not included in scoring.
        </div>
      ) : null}

      {question.case_text ? (
        <p className="mb-3 rounded-md bg-white/70 px-3 py-3 text-base leading-relaxed whitespace-pre-wrap">
          {question.case_text}
        </p>
      ) : null}

      <p className="text-lg leading-relaxed whitespace-pre-wrap">{question.stem}</p>

      <StatementList statements={question.statements} />
      <MatchingPairs pairs={question.pairs} />
      {question.lists ? <MatchingLists lists={question.lists} /> : null}
      {question.table ? <QuestionTable table={question.table} /> : null}

      <OptionList
        questionNumber={question.number}
        options={question.options}
        selectedOption={response?.selected_option ?? null}
        disabled={question.is_dropped}
        onSelect={onSelectOption}
      />
    </article>
  )
}
