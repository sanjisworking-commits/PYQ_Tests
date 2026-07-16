/** Parse API timestamps as UTC even when the trailing Z is missing. */
export function parseUtcMs(value: string): number {
  const trimmed = value.trim()
  if (!trimmed) {
    return Number.NaN
  }

  const hasTimezone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(trimmed)
  const normalized = hasTimezone ? trimmed : `${trimmed}Z`
  return Date.parse(normalized)
}
