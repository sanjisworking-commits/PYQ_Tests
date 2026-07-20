import { useState } from 'react'
import type { SourceExplanation } from '../../types/quiz'
import {
  parseExplanation,
  type ExplanationBlock,
} from '../../utils/explanationFormat'

type SourceExplanationPanelProps = {
  explanations: SourceExplanation[]
  officialAnswer: string | null
}

function VerdictChip({ verdict }: { verdict: 'correct' | 'incorrect' }) {
  const isCorrect = verdict === 'correct'
  return (
    <span
      className={
        isCorrect
          ? 'rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-800 bg-emerald-50'
          : 'rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-red-800 bg-red-50'
      }
    >
      {isCorrect ? 'Correct' : 'Incorrect'}
    </span>
  )
}

function ExplanationBlocks({ text }: { text: string }) {
  const blocks = parseExplanation(text)

  if (blocks.length === 0) {
    return (
      <p className="whitespace-pre-wrap text-base leading-relaxed text-[var(--color-ink)]/90">
        {text}
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {blocks.map((block, index) => (
        <ExplanationBlockView key={`${block.kind}-${index}`} block={block} />
      ))}
    </div>
  )
}

function ExplanationBlockView({ block }: { block: ExplanationBlock }) {
  if (block.kind === 'paragraph') {
    return (
      <p className="text-base leading-relaxed text-[var(--color-ink)]/90">
        {block.text}
      </p>
    )
  }

  if (block.kind === 'bullets') {
    return (
      <ul className="list-disc space-y-1.5 pl-5 text-base leading-relaxed text-[var(--color-ink)]/90">
        {block.items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    )
  }

  return (
    <div className="rounded-md border border-[var(--color-ink)]/10 bg-white/60 px-3 py-2.5">
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <span className="text-base font-semibold text-[var(--color-ink)]">
          {block.label}
        </span>
        <VerdictChip verdict={block.verdict} />
      </div>
      {block.body ? (
        <p className="text-base leading-relaxed text-[var(--color-ink)]/90">
          {block.body}
        </p>
      ) : null}
    </div>
  )
}

export function SourceExplanationPanel({
  explanations,
  officialAnswer,
}: SourceExplanationPanelProps) {
  const preferred =
    explanations.find((item) => item.source === 'forumias') ?? explanations[0]
  const [activeSource, setActiveSource] = useState<string | null>(
    preferred?.source ?? null,
  )

  if (explanations.length === 0) {
    return (
      <section className="mt-4 rounded-md border border-[var(--color-ink)]/10 bg-white/60 px-3 py-3">
        <h3 className="text-base font-semibold text-[var(--color-ink)]">
          Answer analysis
        </h3>
        <p className="mt-2 text-base text-[var(--color-muted)]">
          No coaching explanation imported yet for this question.
        </p>
      </section>
    )
  }

  const active =
    explanations.find((item) => item.source === activeSource) ?? explanations[0]
  const disagrees =
    active.source_answer &&
    officialAnswer &&
    active.source_answer !== officialAnswer

  return (
    <section className="mt-4 rounded-md border border-[var(--color-ink)]/10 bg-white/60">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-ink)]/10 px-3 py-2.5">
        <h3 className="text-base font-semibold text-[var(--color-ink)]">
          Answer analysis
        </h3>
        <div
          className="flex rounded-md border border-[var(--color-ink)]/10 p-0.5"
          role="tablist"
          aria-label="Explanation source"
        >
          {explanations.map((item) => {
            const selected = item.source === active.source
            return (
              <button
                key={item.source}
                type="button"
                role="tab"
                aria-selected={selected}
                className={
                  selected
                    ? 'rounded px-2.5 py-1 text-xs font-semibold text-[var(--color-ink)] bg-[var(--color-ink)]/8'
                    : 'rounded px-2.5 py-1 text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                }
                onClick={() => setActiveSource(item.source)}
              >
                {item.source_label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-3 py-3" role="tabpanel">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          {active.source_answer ? (
            <span className="rounded bg-[var(--color-ink)]/5 px-2 py-0.5 font-medium">
              Institute answer: {active.source_answer}
            </span>
          ) : null}
          {disagrees ? (
            <span className="rounded bg-amber-50 px-2 py-0.5 font-medium text-amber-900">
              Differs from official key ({officialAnswer})
            </span>
          ) : null}
        </div>

        <ExplanationBlocks text={active.explanation} />

        {active.source_url ? (
          <p className="mt-3 text-xs">
            <a
              href={active.source_url}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--color-accent)] underline-offset-2 hover:underline"
            >
              View original source
            </a>
          </p>
        ) : null}
      </div>
    </section>
  )
}
