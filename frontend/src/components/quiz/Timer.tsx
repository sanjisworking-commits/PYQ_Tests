import { formatDuration } from '../../utils/questionState'

type TimerProps = {
  remainingSeconds: number
  isWarning: boolean
}

export function Timer({ remainingSeconds, isWarning }: TimerProps) {
  return (
    <div
      className={[
        'rounded-md px-3 py-1.5 font-mono text-sm font-semibold tracking-wide',
        isWarning
          ? 'bg-red-100 text-red-800'
          : 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]',
      ].join(' ')}
      aria-live="polite"
      aria-atomic="true"
    >
      Time Left: {formatDuration(remainingSeconds)}
    </div>
  )
}
