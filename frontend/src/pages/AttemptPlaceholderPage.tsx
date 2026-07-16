import { Link, useParams } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { PageHeader } from '../components/layout/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'

export function AttemptPlaceholderPage() {
  const { year, slug } = useParams()

  return (
    <AppShell>
      <PageHeader
        eyebrow="Attempt"
        title="Test attempt interface"
        description="Timed attempt UI is scheduled for Sprint 5."
      />
      <EmptyState
        title="Not available yet"
        message="You can continue preparing from the instructions page."
      />
      <p className="mt-6 text-sm">
        <Link
          to={`/upsc/tests/${year}/${slug}/instructions`}
          className="text-[var(--color-accent)] underline-offset-2 hover:underline"
        >
          ← Back to instructions
        </Link>
      </p>
    </AppShell>
  )
}
