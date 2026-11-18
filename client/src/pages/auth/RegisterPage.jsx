import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthFormCard from '../../components/AuthFormCard.jsx'
import Button from '../../components/Button.jsx'
import { useAppDispatch } from '../../redux/hooks.js'
import { signInDemo } from '../../redux/authSlice.js'
import { pushToast } from '../../redux/uiSlice.js'

const fields = [
  { name: 'name', label: 'Full name', type: 'text', autoComplete: 'name', placeholder: 'Your full name' },
  { name: 'email', label: 'Email address', type: 'email', autoComplete: 'email', placeholder: 'you@example.com' },
  { name: 'phone', label: 'Phone number', type: 'tel', autoComplete: 'tel', placeholder: '98765 43210' },
]

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const update = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }))

  const handleSubmit = (event) => {
    event.preventDefault()
    setError('')
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    dispatch(
      signInDemo({
        id: 'demo-new-customer',
        name: form.name,
        email: form.email,
        role: 'customer',
      }),
    )
    dispatch(
      pushToast({
        title: 'Account preview created',
        message: 'Registration will be secured with bcrypt and JWT in Phase 3.',
      }),
    )
    navigate('/', { replace: true })
  }

  return (
    <AuthFormCard
      eyebrow="Get started"
      title="Create your account"
      description="Save your favorites, track orders and check out faster."
      footer={
        <p>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-primary hover:text-brand-dark">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => (
          <div key={field.name}>
            <label htmlFor={`register-${field.name}`} className="mb-1.5 block text-sm font-medium text-text-primary">
              {field.label}
            </label>
            <input
              id={`register-${field.name}`}
              type={field.type}
              autoComplete={field.autoComplete}
              required
              value={form[field.name]}
              onChange={update(field.name)}
              placeholder={field.placeholder}
              className="h-11 w-full rounded-xl border border-app-border px-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
            />
          </div>
        ))}
        <div>
          <label htmlFor="register-password" className="mb-1.5 block text-sm font-medium text-text-primary">
            Password
          </label>
          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            required
            value={form.password}
            onChange={update('password')}
            placeholder="At least 8 characters"
            className="h-11 w-full rounded-xl border border-app-border px-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
          />
        </div>
        <div>
          <label htmlFor="register-confirm" className="mb-1.5 block text-sm font-medium text-text-primary">
            Confirm password
          </label>
          <input
            id="register-confirm"
            type="password"
            autoComplete="new-password"
            required
            value={form.confirmPassword}
            onChange={update('confirmPassword')}
            placeholder="Repeat your password"
            className="h-11 w-full rounded-xl border border-app-border px-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
          />
        </div>

        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

        <Button type="submit" className="w-full" size="lg">
          Create account
        </Button>
        <p className="text-center text-xs text-text-secondary">
          Demo only — no account is persisted yet.
        </p>
      </form>
    </AuthFormCard>
  )
}
