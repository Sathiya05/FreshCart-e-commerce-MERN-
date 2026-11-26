import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, KeyRound, Package, Save, UserRound } from 'lucide-react'
import Button from '../../components/Button.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import { useAppDispatch, useAppSelector } from '../../redux/hooks.js'
import { selectCurrentUser, updateProfile } from '../../redux/authSlice.js'
import { pushToast } from '../../redux/uiSlice.js'

const formatJoined = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN')
}

export default function MyProfilePage() {
  const dispatch = useAppDispatch()
  const user = useAppSelector(selectCurrentUser)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      })
    }
  }, [user])

  const update = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await dispatch(
        updateProfile({ name: form.name.trim(), phone: form.phone.trim() }),
      ).unwrap()

      dispatch(
        pushToast({
          title: 'Profile updated',
          message: 'Your changes have been saved.',
        }),
      )
    } catch (message) {
      setError(typeof message === 'string' ? message : 'Could not save your profile.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="My profile"
        description="Manage your personal information and account preferences."
        breadcrumbs={[{ label: 'Account', to: '/account/profile' }, { label: 'Profile' }]}
      />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Link
          to="/account/orders"
          className="mb-6 flex items-center gap-4 rounded-2xl border border-brand-primary/30 bg-brand-secondary/40 p-5 transition-colors hover:border-brand-primary"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface text-brand-primary">
            <Package size={20} aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-text-primary">My orders</span>
            <span className="mt-0.5 block text-xs text-text-secondary">
              View past orders, details and live tracking.
            </span>
          </span>
          <ArrowRight size={18} className="shrink-0 text-brand-primary" aria-hidden="true" />
        </Link>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-app-border bg-surface p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
            <UserRound size={18} className="text-brand-primary" aria-hidden="true" />
            Personal information
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="profile-name" className="mb-2 block text-sm font-medium text-text-primary">
                Full name
              </label>
              <input
                id="profile-name"
                required
                value={form.name}
                onChange={update('name')}
                className="h-11 w-full rounded-xl border border-app-border px-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
              />
            </div>
            <div>
              <label htmlFor="profile-email" className="mb-2 block text-sm font-medium text-text-primary">
                Email address
              </label>
              <input
                id="profile-email"
                type="email"
                value={form.email}
                readOnly
                className="h-11 w-full rounded-xl border border-app-border bg-app-background px-3 text-sm text-text-secondary"
              />
            </div>
            <div>
              <label htmlFor="profile-phone" className="mb-2 block text-sm font-medium text-text-primary">
                Phone number
              </label>
              <input
                id="profile-phone"
                value={form.phone}
                onChange={update('phone')}
                className="h-11 w-full rounded-xl border border-app-border px-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
              />
            </div>
            <div>
              <label htmlFor="profile-joined" className="mb-2 block text-sm font-medium text-text-primary">
                Member since
              </label>
              <input
                id="profile-joined"
                value={formatJoined(user?.createdAt)}
                readOnly
                className="h-11 w-full rounded-xl border border-app-border bg-app-background px-3 text-sm text-text-secondary"
              />
            </div>
          </div>

          {error && <p className="mt-5 text-sm text-red-600" role="alert">{error}</p>}

          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={submitting}>
              <Save size={16} aria-hidden="true" />
              {submitting ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>

        <section className="mt-6 rounded-2xl border border-app-border bg-surface p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
            <KeyRound size={18} className="text-brand-primary" aria-hidden="true" />
            Security
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            Password changes are not part of the current API yet.
          </p>
          <Button className="mt-4" variant="outline" disabled>
            Change password
          </Button>
        </section>
      </div>
    </>
  )
}
