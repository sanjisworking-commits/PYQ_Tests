import type { QuestionOption } from '../../types/quiz'

type OptionListProps = {
  questionNumber: number
  options: QuestionOption[]
  selectedOption: string | null
  disabled?: boolean
  onSelect: (label: string) => void
}

export function OptionList({
  questionNumber,
  options,
  selectedOption,
  disabled = false,
  onSelect,
}: OptionListProps) {
  const groupName = `question-${questionNumber}-option`

  return (
    <fieldset className="mt-5 space-y-2" disabled={disabled}>
      <legend className="sr-only">Answer options for question {questionNumber}</legend>
      {options.map((option) => {
        const checked = selectedOption === option.label
        const optionId = `${groupName}-${option.label}`
        return (
          <label
            key={option.label}
            htmlFor={optionId}
            className={[
              'flex cursor-pointer gap-3 rounded-md border px-3 py-3 transition',
              'focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--color-accent)]',
              checked
                ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/8'
                : 'border-[var(--color-ink)]/15 bg-white/70 hover:border-[var(--color-accent)]/40',
              disabled ? 'cursor-not-allowed opacity-70' : '',
            ].join(' ')}
          >
            <input
              id={optionId}
              type="radio"
              name={groupName}
              value={option.label}
              checked={checked}
              disabled={disabled}
              onChange={() => onSelect(option.label)}
              className="mt-1 size-4 accent-[var(--color-accent)]"
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
