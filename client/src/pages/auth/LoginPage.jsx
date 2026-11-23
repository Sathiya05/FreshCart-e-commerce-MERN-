import { useEffect, useRef, useState } from 'react'
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthFormCard from '../../components/AuthFormCard.jsx'
import Button from '../../components/Button.jsx'
import { useAppDispatch } from '../../redux/hooks.js'
import { clearAuthError, googleSignInUser, loginUser } from '../../redux/authSlice.js'
import { getGoogleAuthConfig } from '../../services/auth.service.js'
import { pushToast } from '../../redux/uiSlice.js'

const normalizeDestination = (from) => {
  const raw =
    typeof from === 'string'
      ? from
      : from?.pathname
        ? `${from.pathname}${from.search || ''}${from.hash || ''}`
        : '/'

  // Only allow local paths. A string like //evil.com would otherwise become a
  // protocol-relative URL after sign-in.
  return raw.startsWith('/') && !raw.startsWith('//') ? raw : '/'
}

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
  </svg>
)

const loadGoogleIdentityScript = () =>
  new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve()
      return
    }

    let script = document.getElementById('google-identity-services')
    if (!script) {
      script = document.createElement('script')
      script.id = 'google-identity-services'
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }

    script.addEventListener('load', () => resolve(), { once: true })
    script.addEventListener(
      'error',
      () => reject(new Error('Could not load Google sign-in.')),
      { once: true },
    )
  })

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [googleConfig, setGoogleConfig] = useState(null)
  const [googleError, setGoogleError] = useState('')
  const [googleBusy, setGoogleBusy] = useState(false)
  const googleButtonRef = useRef(null)
  const googleCallbackRef = useRef(null)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const destination = normalizeDestination(location.state?.from)
  const googleEnabled = Boolean(googleConfig?.enabled && googleConfig?.clientId)
  const googleClientId = googleConfig?.clientId || ''

  useEffect(() => {
    dispatch(clearAuthError())
  }, [dispatch])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    if (!form.email.trim() || !form.password.trim()) {
      setError('Enter both email and password to continue.')
      return
    }

    setSubmitting(true)
    try {
      const result = await dispatch(
        loginUser({ email: form.email.trim(), password: form.password }),
      ).unwrap()

      const isAdmin = result.user?.role === 'admin'
      const target = isAdmin
        ? '/admin'
        : destination.startsWith('/admin')
          ? '/'
          : destination

      dispatch(
        pushToast({
          title: 'Welcome back',
          message: isAdmin ? 'Signed in to the admin console.' : 'You are signed in.',
        }),
      )
      navigate(target, { replace: true })
    } catch (message) {
      setError(typeof message === 'string' ? message : 'Could not sign in. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoogleCredential = async (response) => {
    setGoogleError('')
    if (!response?.credential) return

    setGoogleBusy(true)
    try {
      const result = await dispatch(googleSignInUser(response.credential)).unwrap()
      const isAdmin = result.user?.role === 'admin'
      const target = isAdmin
        ? '/admin'
        : destination.startsWith('/admin')
          ? '/'
          : destination

      dispatch(
        pushToast({
          title: 'Welcome to FreshCart',
          message: isAdmin ? 'Signed in to the admin console.' : 'Signed in with Google.',
        }),
      )
      navigate(target, { replace: true })
    } catch (message) {
      setGoogleError(
        typeof message === 'string'
          ? message
          : 'Could not sign in with Google. Please try again.',
      )
    } finally {
      setGoogleBusy(false)
    }
  }

  googleCallbackRef.current = handleGoogleCredential

  useEffect(() => {
    let active = true
    getGoogleAuthConfig()
      .then((config) => {
        if (active) setGoogleConfig(config || null)
      })
      .catch(() => {
        if (active) setGoogleConfig(null)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!googleEnabled) return undefined

    let cancelled = false
    loadGoogleIdentityScript()
      .then(() => {
        if (cancelled || !googleButtonRef.current || !window.google?.accounts?.id) return

        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response) => googleCallbackRef.current?.(response),
        })
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          width: 320,
          text: 'continue_with',
          shape: 'pill',
        })
      })
      .catch(() => {
        if (!cancelled) setGoogleConfig(null)
      })

    return () => {
      cancelled = true
    }
  }, [googleEnabled, googleClientId])

  return (
    <AuthFormCard
      eyebrow="Welcome back"
      title="Sign in to FreshCart"
      description="Access your orders, addresses and saved groceries."
      footer={
        <p>
          New to FreshCart?{' '}
          <Link to="/register" className="font-semibold text-brand-primary hover:text-brand-dark">
            Create an account
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-text-primary">
            Email address
          </label>
          <div className="relative">
            <Mail size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="you@example.com"
              className="h-11 w-full rounded-xl border border-app-border pl-10 pr-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="login-password" className="text-sm font-medium text-text-primary">
              Password
            </label>
            <Link to="/forgot-password" className="inline-block py-1 text-xs font-semibold text-brand-primary">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <LockKeyhole size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="Enter your password"
              className="h-11 w-full rounded-xl border border-app-border pl-10 pr-10 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-1 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-lg text-text-secondary hover:text-text-primary"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

        <Button type="submit" className="w-full" size="lg" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <div className="mt-6">
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-app-border" />
          <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            or
          </span>
          <span className="h-px flex-1 bg-app-border" />
        </div>

        <div className="mt-4">
          {googleEnabled ? (
            <div ref={googleButtonRef} className="flex min-h-11 justify-center" />
          ) : (
            <button
              type="button"
              disabled
              className="flex h-11 w-full cursor-not-allowed items-center justify-center gap-3 rounded-xl border border-app-border bg-surface text-sm font-semibold text-text-secondary opacity-70"
            >
              <GoogleIcon />
              Continue with Google
            </button>
          )}

          {googleBusy && (
            <p className="mt-2 text-center text-xs text-text-secondary">
              Finishing Google sign-in…
            </p>
          )}
          {googleError && (
            <p className="mt-2 text-center text-sm text-red-600" role="alert">
              {googleError}
            </p>
          )}
          {!googleEnabled && (
            <p className="mt-2 text-center text-xs leading-5 text-text-secondary">
              Google sign-in is not configured yet. Use your email and password.
            </p>
          )}
        </div>
      </div>

      <p className="mt-6 text-center text-xs leading-5 text-text-secondary">
        Use your FreshCart account. Admin access requires an administrator account created with
        the server setup script.
      </p>
    </AuthFormCard>
  )
}
