import { useState } from 'react'
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthFormCard from '../../components/AuthFormCard.jsx'
import Button from '../../components/Button.jsx'
import { useAppDispatch } from '../../redux/hooks.js'
import { signInDemo } from '../../redux/authSlice.js'
import { pushToast } from '../../redux/uiSlice.js'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const destination = location.state?.from || '/'

  const startDemoSession = (role) => {
    dispatch(
      signInDemo({
        id: role === 'admin' ? 'demo-admin' : 'demo-customer',
        name: role === 'admin' ? 'FreshCart Admin' : 'Santhosh Kumar',
        email: role === 'admin' ? 'admin@freshcart.demo' : 'shopper@freshcart.demo',
        role,
      }),
    )
    dispatch(
      pushToast({
        title: 'Demo session started',
        message: role === 'admin' ? 'You are viewing the admin console.' : 'Welcome back to FreshCart.',
      }),
    )
    navigate(role === 'admin' && destination === '/' ? '/admin' : destination, { replace: true })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setError('')
    if (!form.email.trim() || !form.password.trim()) {
      setError('Enter both email and password to continue.')
      return
    }
    startDemoSession('customer')
  }

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
            <Link to="/forgot-password" className="text-xs font-semibold text-brand-primary">
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

        <Button type="submit" className="w-full" size="lg">
          Sign in
        </Button>
      </form>

      <div className="mt-7">
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-app-border" />
          <span className="text-xs text-text-secondary">Phase 2 demo access</span>
          <span className="h-px flex-1 bg-app-border" />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Button variant="outline" onClick={() => startDemoSession('customer')}>
            <UserRound size={16} aria-hidden="true" />
            Customer demo
          </Button>
          <Button variant="outline" onClick={() => startDemoSession('admin')}>
            <ShieldCheck size={16} aria-hidden="true" />
            Admin demo
          </Button>
        </div>
        <p className="mt-3 text-center text-xs text-text-secondary">
          Demo sign-in sets local UI state only. Real JWT authentication arrives in Phase 3.
        </p>
      </div>
    </AuthFormCard>
  )
}
