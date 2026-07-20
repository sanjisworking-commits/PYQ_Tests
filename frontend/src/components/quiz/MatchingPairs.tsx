import type { MatchingPair } from '../../types/quiz'

type MatchingPairsProps = {
  pairs: MatchingPair[]
}

export function MatchingPairs({ pairs }: MatchingPairsProps) {
  if (pairs.length === 0) {
    return null
  }

  return (
    <div className="mt-4 overflow-x-auto rounded-md border border-[var(--color-ink)]/10">
      <table className="min-w-full text-left text-base">
        <thead className="bg-[var(--color-accent)]/8">
          <tr>
            <th className="px-3 py-2 font-semibold">Column I</th>
            <th className="px-3 py-2 font-semibold">Column II</th>
          </tr>
        </thead>
        <tbody>
          {pairs.map((pair) => (
            <tr key={`${pair.left}-${pair.right}`} className="border-t border-[var(--color-ink)]/10">
              <td className="px-3 py-2">{pair.left}</td>
              <td className="px-3 py-2">{pair.right}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
