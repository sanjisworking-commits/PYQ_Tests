import { useEffect, useState } from 'react'

type HealthResponse = {
  status: string
  service: string
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:8000'

export function HomePage() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadHealth() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/health`)
        if (!response.ok) {
          throw new Error(`Health check failed (${response.status})`)
        }
        const data = (await response.json()) as HealthResponse
        if (!cancelled) {
          setHealth(data)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setHealth(null)
          setError(err instanceof Error ? err.message : 'Unable to reach API')
        }
      }
    }

    void loadHealth()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-16">
      <p className="mb-3 text-sm tracking-[0.2em] text-[var(--color-muted)] uppercase">
        Personal practice
      </p>
      <h1 className="text-5xl leading-tight font-semibold text-[var(--color-accent)] sm:text-6xl">
        PYQ
      </h1>
      <p className="mt-4 max-w-xl text-lg text-[var(--color-ink)]/80">
        UPSC Civil Services Examination previous-year question practice platform.
        Sprint 1 foundation is running.
      </p>

      <section className="mt-10 border-t border-[var(--color-ink)]/10 pt-6">
        <h2 className="text-sm tracking-[0.16em] text-[var(--color-muted)] uppercase">
          Backend status
        </h2>
        {health ? (
          <p className="mt-2 text-base">
            Connected to <span className="font-medium">{health.service}</span> (
            {health.status})
          </p>
        ) : (
          <p className="mt-2 text-base text-red-800">
            {error ?? 'Checking API health...'}
          </p>
        )}
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          API base: {API_BASE_URL}
        </p>
      </section>
    </main>
  )
}
