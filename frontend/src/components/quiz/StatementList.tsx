import type { QuestionStatement } from '../../types/quiz'

type StatementListProps = {
  statements: QuestionStatement[]
}

export function StatementList({ statements }: StatementListProps) {
  if (statements.length === 0) {
    return null
  }

  return (
    <ol className="mt-4 space-y-2 rounded-md bg-[var(--color-accent)]/5 px-4 py-3 text-sm">
      {statements.map((statement) => (
        <li key={statement.label} className="flex gap-2">
          <span className="font-semibold">{statement.label}.</span>
          <span>{statement.text}</span>
        </li>
      ))}
    </ol>
  )
}
