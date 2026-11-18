import { useState } from 'react'
import { Link, Mail } from 'lucide-react'
import AuthFormCard from '../../components/AuthFormCard.jsx'
import Button from '../../components/Button.jsx'
import { useAppDispatch } from '../../redux/hooks.js'
import { pushToast } from '../../redux/uiSlice.js'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const dispatch = useAppDispatch()

  const handleSubmit = (event) => {
    event.preventDefault()
    setSent(true)
    dispatch(
      pushToast({
        title: 'Demo reset link requested',
        message: 'Nodemailer email delivery is implemented in Phase 4.',
      }),
    )
  }

  return (
    <AuthFormCard
      eyebrow="Account recovery"
      title="Forgot your password?"
      description="Enter your email and we will prepare a reset link."
      footer={
        <Link to="/login" className="font-semibold text-brand-primary hover:text-brand-dark">
          ← Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-800">
          If an account exists for <strong>{email}</strong>, a reset link would be
          sent. This is a Phase 2 preview — no email has been delivered.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="forgot-email" className="mb-2 block text-sm font-medium text-text-primary">
              Email address
            </label>
            <div className="relative">
              <Mail size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
              <input
                id="forgot-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="h-11 w-full rounded-xl border border-app-border pl-10 pr-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
              />
            </div>
          </div>
          <Button type="submit" className="w-full" size="lg">
            Send reset link
          </Button>
        </form>
      )}
    </AuthFormCard>
  )
}
