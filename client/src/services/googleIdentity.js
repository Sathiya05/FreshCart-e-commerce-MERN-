import { getGoogleAuthConfig } from './auth.service.js'

const SCRIPT_ID = 'google-identity-services'
const SCRIPT_TIMEOUT_MS = 15000
const CONFIG_RETRY_DELAY_MS = 600

let configPromise = null
let scriptPromise = null

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const isTransient = (error) =>
  !error?.response || error.response.status >= 500 || error.code === 'ECONNABORTED'

const fetchConfig = async (allowRetry) => {
  try {
    const config = await getGoogleAuthConfig()
    if (!config?.enabled || !config?.clientId) {
      throw new Error('Google sign-in is not configured on this server.')
    }
    return config
  } catch (error) {
    // A cold API can still be waking up. One quiet retry avoids making the
    // customer restart the sign-in flow.
    if (allowRetry && isTransient(error)) {
      await delay(CONFIG_RETRY_DELAY_MS)
      return fetchConfig(false)
    }
    throw error
  }
}

/** Public, non-secret Google client ID. Cached for the whole app session. */
export const getGoogleConfig = ({ force = false } = {}) => {
  if (force) configPromise = null
  if (!configPromise) {
    configPromise = fetchConfig(true).catch((error) => {
      configPromise = null
      throw error
    })
  }
  return configPromise
}

/**
 * Loads the Google Identity Services script exactly once. Listeners are added
 * before the script is inserted so a cached/fast load cannot be missed, and a
 * failed script is removed so Retry actually loads a fresh one.
 */
export const loadGoogleIdentity = () => {
  if (window.google?.accounts?.id) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    let script = document.getElementById(SCRIPT_ID)
    let timeoutId

    const detach = () => {
      clearTimeout(timeoutId)
      if (script) {
        script.removeEventListener('load', handleLoad)
        script.removeEventListener('error', handleError)
      }
    }

    const fail = (message) => {
      detach()
      script?.remove()
      reject(new Error(message))
    }

    const handleLoad = () => {
      if (window.google?.accounts?.id) {
        detach()
        resolve()
      } else {
        fail('Google sign-in did not load correctly.')
      }
    }

    const handleError = () => fail('Could not load Google sign-in.')

    if (!script) {
      script = document.createElement('script')
      script.id = SCRIPT_ID
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
    }

    script.addEventListener('load', handleLoad)
    script.addEventListener('error', handleError)
    timeoutId = setTimeout(
      () => fail('Google sign-in took too long to load. Check your connection.'),
      SCRIPT_TIMEOUT_MS,
    )

    if (!script.parentNode) document.head.appendChild(script)
  }).catch((error) => {
    scriptPromise = null
    throw error
  })

  return scriptPromise
}
