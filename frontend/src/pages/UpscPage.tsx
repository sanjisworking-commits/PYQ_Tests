import { AppShell } from '../components/layout/AppShell'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'

export function UpscPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Exam section"
        title="UPSC Civil Services Examination"
        description="Practice previous-year preliminary papers. Tests are loaded from structured data files — no public upload interface."
      />
      <div className="max-w-2xl space-y-4 text-[var(--color-ink)]/80">
        <p>
          Available papers include <strong>2025</strong> and{' '}
          <strong>2026 General Studies Paper I</strong>{' '}
          (Series A — full 100-question set).
        </p>
        <p>
          Later years are listed as Coming Soon until their question data is added.
        </p>
      </div>
      <div className="mt-8">
        <Button to="/upsc/tests">Attempt Tests</Button>
      </div>
    </AppShell>
  )
}
