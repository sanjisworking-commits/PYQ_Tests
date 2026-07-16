export type StoredAttemptRef = {
  attemptId: string
  expiresAt: string
}

function storageKey(testId: string): string {
  return `pyq:activeAttempt:${testId}`
}

export function saveActiveAttempt(
  testId: string,
  value: StoredAttemptRef,
): void {
  localStorage.setItem(storageKey(testId), JSON.stringify(value))
}

export function loadActiveAttempt(testId: string): StoredAttemptRef | null {
  const raw = localStorage.getItem(storageKey(testId))
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as StoredAttemptRef
    if (!parsed.attemptId || !parsed.expiresAt) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function clearActiveAttempt(testId: string): void {
  localStorage.removeItem(storageKey(testId))
}
