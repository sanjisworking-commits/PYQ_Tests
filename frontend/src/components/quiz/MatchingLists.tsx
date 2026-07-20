import type { MatchingLists as MatchingListsData } from '../../types/quiz'

type MatchingListsProps = {
  lists: MatchingListsData
}

export function MatchingLists({ lists }: MatchingListsProps) {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <div className="rounded-md border border-[var(--color-ink)]/10 px-3 py-3">
        <h3 className="mb-2 text-base font-semibold">List I</h3>
        <ul className="space-y-1 text-base">
          {lists.list_i.map((item) => (
            <li key={item.label}>
              <span className="font-semibold">{item.label}.</span> {item.text}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-md border border-[var(--color-ink)]/10 px-3 py-3">
        <h3 className="mb-2 text-base font-semibold">List II</h3>
        <ul className="space-y-1 text-base">
          {lists.list_ii.map((item) => (
            <li key={item.label}>
              <span className="font-semibold">{item.label}.</span> {item.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
