type PageHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
}

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <header className="mb-8 max-w-2xl">
      {eyebrow ? (
        <p className="mb-2 text-xs tracking-[0.18em] text-[var(--color-muted)] uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-3xl font-semibold text-[var(--color-ink)] sm:text-4xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-3 text-base text-[var(--color-ink)]/75">{description}</p>
      ) : null}
    </header>
  )
}
