import type { QuestionTable as QuestionTableData } from '../../types/quiz'

type QuestionTableProps = {
  table: QuestionTableData
}

export function QuestionTable({ table }: QuestionTableProps) {
  return (
    <div className="mt-4 overflow-x-auto rounded-md border border-[var(--color-ink)]/10">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-[var(--color-accent)]/8">
          <tr>
            {table.headers.map((header) => (
              <th key={header} className="px-3 py-2 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, index) => (
            <tr key={`row-${index}`} className="border-t border-[var(--color-ink)]/10">
              {row.map((cell, cellIndex) => (
                <td key={`cell-${index}-${cellIndex}`} className="px-3 py-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
