import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'

type Variant = 'primary' | 'secondary' | 'ghost'

type CommonProps = {
  children: ReactNode
  variant?: Variant
  className?: string
}

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & {
    to?: undefined
  }

type ButtonAsLink = CommonProps & {
  to: string
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-[var(--color-accent)] text-white hover:bg-[#0c3d4a] focus-visible:outline-[var(--color-accent)]',
  secondary:
    'border border-[var(--color-accent)]/30 bg-white/70 text-[var(--color-accent)] hover:bg-white focus-visible:outline-[var(--color-accent)]',
  ghost:
    'text-[var(--color-accent)] hover:bg-[var(--color-accent)]/8 focus-visible:outline-[var(--color-accent)]',
}

const baseClasses =
  'inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-medium tracking-wide transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

function classesFor(variant: Variant, className: string): string {
  return `${baseClasses} ${variantClasses[variant]} ${className}`.trim()
}

export function Button(props: ButtonAsButton | ButtonAsLink) {
  if (props.to) {
    const { to, children, variant = 'primary', className = '' } = props
    return (
      <Link to={to} className={classesFor(variant, className)}>
        {children}
      </Link>
    )
  }

  const { children, variant = 'primary', className = '', ...rest } = props
  return (
    <button className={classesFor(variant, className)} {...rest}>
      {children}
    </button>
  )
}
