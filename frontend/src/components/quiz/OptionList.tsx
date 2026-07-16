import type { QuestionOption } from '../../types/quiz'

type OptionListProps = {
  options: QuestionOption[]
  selectedOption: string | null
  disabled?: boolean
  onSelect: (label: string) => void
}

export function OptionList({
  options,
  selectedOption,
  disabled = false,
  onSelect,
}: OptionListProps) {
  return (
    <fieldset className="mt-5 space-y-2" disabled={disabled}>
      <legend className="sr-only">Answer options</legend>
      {options.map((option) => {
        const checked = selectedOption === option.label
        return (
          <label
            key={option.label}
            className={[
              'flex cursor-pointer gap-3 rounded-md border px-3 py-3 transition',
              checked
                ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/8'
                : 'border-[var(--color-ink)]/15 bg-white/70 hover:border-[var(--color-accent)]/40',
              disabled ? 'cursor-not-allowed opacity-70' : '',
            ].join(' ')}
          >
            <input
              type="radio"
              name="question-option"
              value={option.label}
              checked={checked}
              disabled={disabled}
              onChange={() => onSelect(option.label)}
              className="mt-1 size-4 accent-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
            />
            <span className="text-sm leading-relaxed">
              <span className="mr-2 font-semibold">{option.label}.</span>
              {option.text}
            </span>
          </label>
        )
      })}
    </fieldset>
  )
}
