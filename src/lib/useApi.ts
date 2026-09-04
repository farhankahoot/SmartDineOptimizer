import { useCallback, useEffect, useRef, useState } from 'react'
import { api, messageOf } from '@/lib/api'

interface QueryState<T> {
  data: T | null
  loading: boolean
  error: string | null
  refresh: () => void
}

/**
 * Loads a GET endpoint and re-runs whenever the query changes.
 *
 * `query` is compared by value, so a caller can pass an inline object without
 * causing a request loop — the common trap when filters live in component
 * state.
 */
export function useApi<T>(
  path: string | null,
  query?: Record<string, string | number | boolean | undefined | null>,
): QueryState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(Boolean(path))
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const key = JSON.stringify(query ?? {})
  // Held in a ref so the effect depends on the serialised key, not the object.
  const queryRef = useRef(query)
  queryRef.current = query

  useEffect(() => {
    if (!path) {
      setData(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    api
      .get<T>(path, queryRef.current)
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(messageOf(err))
          setData(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [path, key, tick])

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  return { data, loading, error, refresh }
}
