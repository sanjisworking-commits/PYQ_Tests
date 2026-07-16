import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

type AppShellProps = {
  children: ReactNode
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-md px-3 py-2 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]',
    isActive
      ? 'bg-[var(--color-accent)]/10 font-medium text-[var(--color-accent)]'
      : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]',
  ].join(' ')

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="border-b border-[var(--color-ink)]/10 bg-[rgba(248,244,238,0.85)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <NavLink
            to="/"
            className="text-lg font-semibold tracking-wide text-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
          >
            PYQ
          </NavLink>
          <nav
            className="flex max-w-[70%] flex-wrap items-center justify-end gap-1"
            aria-label="Primary"
          >
            <NavLink to="/upsc" className={navLinkClass}>
              UPSC
            </NavLink>
            <NavLink to="/upsc/tests" className={navLinkClass}>
              Attempt Tests
            </NavLink>
            <NavLink to="/dashboard" className={navLinkClass}>
              Dashboard
            </NavLink>
          </nav>
        </div>
      </header>
      <div id="main-content" className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </div>
    </div>
  )
}
