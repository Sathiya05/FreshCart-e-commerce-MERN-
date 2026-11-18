import { useEffect, useState } from 'react'

/**
 * Small async-state helper for service/API-backed data fetching.
 * Returns { status, data, error, isLoading, isError, refetch }.
 */
export const useAsync = (factory, dependencies = []) => {
  const [state, setState] = useState({
    status: 'loading',
    data: null,
    error: null,
  })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    setState({ status: 'loading', data: null, error: null })

    Promise.resolve()
      .then(factory)
      .then((data) => {
        if (active) setState({ status: 'success', data, error: null })
      })
      .catch((error) => {
        if (active) {
          setState({
            status: 'error',
            data: null,
            error: error?.message || 'Something went wrong. Please try again.',
          })
        }
      })

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, attempt])

  const refetch = () => setAttempt((value) => value + 1)

  return {
    ...state,
    isLoading: state.status === 'loading',
    isError: state.status === 'error',
    refetch,
  }
}
