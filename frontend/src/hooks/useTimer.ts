import { useEffect, useState } from 'react'

const WARNING_THRESHOLD_SECONDS = 10 * 60

export function useTimer(
  expiresAt: string | null,
  onExpire: () => void,
): {
  remainingSeconds: number
  isWarning: boolean
} {
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    expiresAt ? secondsUntil(expiresAt) : 0,
  )

  useEffect(() => {
    if (!expiresAt) {
      setRemainingSeconds(0)
      return
    }

    let expiredHandled = false

    const tick = () => {
      const remaining = secondsUntil(expiresAt)
      setRemainingSeconds(remaining)
      if (remaining <= 0 && !expiredHandled) {
        expiredHandled = true
        onExpire()
      }
    }

    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [expiresAt, onExpire])

  return {
    remainingSeconds,
    isWarning: remainingSeconds > 0 && remainingSeconds < WARNING_THRESHOLD_SECONDS,
  }
}

function secondsUntil(expiresAt: string): number {
  const expiresMs = Date.parse(expiresAt)
  if (Number.isNaN(expiresMs)) {
    return 0
  }
  return Math.max(0, Math.ceil((expiresMs - Date.now()) / 1000))
}
