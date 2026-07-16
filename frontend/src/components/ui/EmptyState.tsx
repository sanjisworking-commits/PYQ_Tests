type EmptyStateProps = {
  title: string
  message: string
}

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <div className="rounded-md border border-dashed border-[var(--color-ink)]/20 bg-white/40 px-4 py-8 text-center">
      <p className="font-medium text-[var(--color-ink)]">{title}</p>
      <p className="mt-2 text-sm text-[var(--color-muted)]">{message}</p>
    </div>
  )
}
