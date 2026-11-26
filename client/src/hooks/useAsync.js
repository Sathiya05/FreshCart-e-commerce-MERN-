import { useCallback, useEffect, useState } from 'react'

/**
 * Small async-state helper for service/API-backed data fetching.
 * Returns { status, data, error, isRefreshing, isLoading, isError, refetch }.
 *
 * A refresh keeps the previous data on screen instead of flashing a skeleton,
 * and a failed background refresh does not erase already-loaded data.
 */
export const useAsync = (factory, dependencies = []) => {
  const [state, setState] = useState({
    status: 'loading',
    data: null,
    error: null,
    isRefreshing: false,
  })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true

    setState((current) =>
      current.data == null
        ? { status: 'loading', data: null, error: null, isRefreshing: false }
        : { ...current, error: null, isRefreshing: true },
    )

    Promise.resolve()
      .then(factory)
      .then((data) => {
        if (active) {
          setState({ status: 'success', data, error: null, isRefreshing: false })
        }
      })
      .catch((error) => {
        if (!active) return
        const message = error?.message || 'Something went wrong. Please try again.'
        setState((current) =>
          current.data != null
            ? { ...current, error: message, isRefreshing: false }
            : { status: 'error', data: null, error: message, isRefreshing: false },
        )
      })

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, attempt])

  const refetch = useCallback(() => setAttempt((value) => value + 1), [])

  return {
    ...state,
    isLoading: state.status === 'loading',
    isError: state.status === 'error',
    refetch,
  }
}
