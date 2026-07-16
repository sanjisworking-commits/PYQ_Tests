import { AppShell } from '../components/layout/AppShell'
import { PageHeader } from '../components/layout/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'

export function DashboardPlaceholderPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Personal"
        title="Scores Dashboard"
        description="Review submitted attempt scores for each test."
      />
      <EmptyState
        title="Coming in Sprint 7"
        message="This page will list your submitted scores once the dashboard API is added."
      />
    </AppShell>
  )
}
