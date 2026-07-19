import { useEffect, useState } from 'react'

type QuestionNotesEditorProps = {
  questionNumber: number
  initialBody: string
  onSave: (body: string) => Promise<void>
}

export function QuestionNotesEditor({
  questionNumber,
  initialBody,
  onSave,
}: QuestionNotesEditorProps) {
  const [body, setBody] = useState(initialBody)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setBody(initialBody)
  }, [initialBody, questionNumber])

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      await onSave(body)
      setSavedAt(new Date().toLocaleTimeString())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save notes')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mt-4 rounded-md border border-[var(--color-ink)]/10 bg-white/60 px-3 py-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--color-ink)]">
          My notes
        </h3>
        <div className="flex items-center gap-2">
          {savedAt ? (
            <span className="text-xs text-[var(--color-muted)]">
              Saved {savedAt}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#0c3d4a] disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
      <label className="sr-only" htmlFor={`note-${questionNumber}`}>
        Notes for question {questionNumber}
      </label>
      <textarea
        id={`note-${questionNumber}`}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        onBlur={() => {
          if (body !== initialBody) {
            void handleSave()
          }
        }}
        rows={4}
        placeholder="Add revision notes for this question…"
        className="w-full resize-y rounded-md border border-[var(--color-ink)]/15 bg-white px-3 py-2 text-sm leading-relaxed text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]"
      />
      {error ? (
        <p className="mt-1 text-xs text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  )
}
