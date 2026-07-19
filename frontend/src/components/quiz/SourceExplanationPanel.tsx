import { useState } from 'react'
import type { SourceExplanation } from '../../types/quiz'

type SourceExplanationPanelProps = {
  explanations: SourceExplanation[]
  officialAnswer: string | null
}

export function SourceExplanationPanel({
  explanations,
  officialAnswer,
}: SourceExplanationPanelProps) {
  const [openSource, setOpenSource] = useState<string | null>(
    explanations[0]?.source ?? null,
  )

  if (explanations.length === 0) {
    return (
      <section className="mt-4 rounded-md border border-[var(--color-ink)]/10 bg-white/60 px-3 py-3">
        <h3 className="text-sm font-semibold text-[var(--color-ink)]">
          Answer analysis
        </h3>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          No coaching explanation imported yet for this question.
        </p>
      </section>
    )
  }

  return (
    <section className="mt-4 space-y-2">
      <h3 className="text-sm font-semibold text-[var(--color-ink)]">
        Answer analysis
      </h3>
      {explanations.map((item) => {
        const isOpen = openSource === item.source
        const disagrees =
          item.source_answer &&
          officialAnswer &&
          item.source_answer !== officialAnswer

        return (
          <div
            key={item.source}
            className="rounded-md border border-[var(--color-ink)]/10 bg-white/60"
          >
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm font-medium text-[var(--color-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
              aria-expanded={isOpen}
              onClick={() =>
                setOpenSource(isOpen ? null : item.source)
              }
            >
              <span>{item.source_label}</span>
              <span className="text-xs font-normal text-[var(--color-muted)]">
                {isOpen ? 'Hide' : 'Show'}
              </span>
            </button>
            {isOpen ? (
              <div className="border-t border-[var(--color-ink)]/10 px-3 py-3">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                  {item.source_answer ? (
                    <span className="rounded bg-[var(--color-ink)]/5 px-2 py-0.5 font-medium">
                      Institute answer: {item.source_answer}
                    </span>
                  ) : null}
                  {disagrees ? (
                    <span className="rounded bg-amber-50 px-2 py-0.5 font-medium text-amber-900">
                      Differs from official key ({officialAnswer})
                    </span>
                  ) : null}
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-ink)]/90">
                  {item.explanation}
                </p>
                {item.source_url ? (
                  <p className="mt-2 text-xs">
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--color-accent)] underline-offset-2 hover:underline"
                    >
                      View original source
                    </a>
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        )
      })}
    </section>
  )
}
