import type { StudyRef } from '../../types/quiz'

type StudyRefsListProps = {
  refs: StudyRef[]
}

export function StudyRefsList({ refs }: StudyRefsListProps) {
  return (
    <section className="mt-4 rounded-md border border-[var(--color-ink)]/10 bg-white/60 px-3 py-3">
      <h3 className="text-sm font-semibold text-[var(--color-ink)]">
        Revise here
      </h3>
      {refs.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          No syllabus mapping yet for this question.
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {refs.map((ref) => (
            <li
              key={`${ref.subject}-${ref.topic}-${ref.subtopic}`}
              className="text-sm leading-relaxed text-[var(--color-ink)]/90"
            >
              <span className="font-medium">{ref.subject}</span>
              <span className="text-[var(--color-muted)]"> · </span>
              {ref.topic}
              <span className="text-[var(--color-muted)]"> · </span>
              {ref.subtopic}
              {ref.ncert_hint ? (
                <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                  NCERT: {ref.ncert_hint}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
