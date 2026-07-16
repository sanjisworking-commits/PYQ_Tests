type LoadingStateProps = {
  label?: string
}

export function LoadingState({ label = 'Loading…' }: LoadingStateProps) {
  return (
    <div
      className="rounded-md border border-[var(--color-ink)]/10 bg-white/50 px-4 py-6 text-[var(--color-muted)]"
      role="status"
      aria-live="polite"
    >
      {label}
    </div>
  )
}
