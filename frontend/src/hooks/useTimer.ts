import { useEffect, useState } from 'react'
import { parseUtcMs } from '../utils/datetime'

const WARNING_THRESHOLD_SECONDS = 10 * 60

export function useTimer(
  expiresAt: string | null,
  onExpire: () => void,
  enabled: boolean = true,
): {
  remainingSeconds: number
  isWarning: boolean
} {
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    expiresAt && enabled ? secondsUntil(expiresAt) : 0,
  )

  useEffect(() => {
    if (!expiresAt || !enabled) {
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
  }, [enabled, expiresAt, onExpire])

  return {
    remainingSeconds,
    isWarning:
      enabled && remainingSeconds > 0 && remainingSeconds < WARNING_THRESHOLD_SECONDS,
  }
}

function secondsUntil(expiresAt: string): number {
  const expiresMs = parseUtcMs(expiresAt)
  if (Number.isNaN(expiresMs)) {
    return 0
  }
  return Math.max(0, Math.ceil((expiresMs - Date.now()) / 1000))
}
