import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AuthFormCard from '../../components/AuthFormCard.jsx'
import Button from '../../components/Button.jsx'
import { useAppDispatch } from '../../redux/hooks.js'
import { pushToast } from '../../redux/uiSlice.js'

export default function ResetPasswordPage() {
  const { token } = useParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const dispatch = useAppDispatch()

  const handleSubmit = (event) => {
    event.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    dispatch(
      pushToast({
        title: 'Password reset preview',
        message: `Token ${token || 'demo-token'} would be verified by the API in Phase 3.`,
      }),
    )
  }

  return (
    <AuthFormCard
      eyebrow="Account recovery"
      title="Reset your password"
      description="Choose a strong new password for your FreshCart account."
      footer={
        <Link to="/login" className="font-semibold text-brand-primary hover:text-brand-dark">
          ← Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="reset-password" className="mb-2 block text-sm font-medium text-text-primary">
            New password
          </label>
          <input
            id="reset-password"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-11 w-full rounded-xl border border-app-border px-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
          />
        </div>
        <div>
          <label htmlFor="reset-confirm" className="mb-2 block text-sm font-medium text-text-primary">
            Confirm new password
          </label>
          <input
            id="reset-confirm"
            type="password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="h-11 w-full rounded-xl border border-app-border px-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
          />
        </div>
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <Button type="submit" className="w-full" size="lg">
          Reset password
        </Button>
        <p className="text-center text-xs text-text-secondary">
          Demo only — no password is stored or changed.
        </p>
      </form>
    </AuthFormCard>
  )
}
