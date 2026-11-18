import { useEffect, useState } from 'react'
import { KeyRound, Save, UserRound } from 'lucide-react'
import Button from '../../components/Button.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import { SkeletonLine } from '../../components/Skeleton.jsx'
import { useAppDispatch } from '../../redux/hooks.js'
import { pushToast } from '../../redux/uiSlice.js'
import { useAsync } from '../../hooks/useAsync.js'
import { getDemoProfile } from '../../services/account.service.js'

export default function MyProfilePage() {
  const dispatch = useAppDispatch()
  const { status, data, error, refetch } = useAsync(getDemoProfile, [])
  const [form, setForm] = useState({ name: '', email: '', phone: '' })

  useEffect(() => {
    if (data) setForm({ name: data.name, email: data.email, phone: data.phone })
  }, [data])

  const update = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }))

  const handleSubmit = (event) => {
    event.preventDefault()
    dispatch(
      pushToast({
        title: 'Profile saved in preview',
        message: 'Profile updates will persist through the API in Phase 3.',
      }),
    )
  }

  return (
    <>
      <PageHeader
        title="My profile"
        description="Manage your personal information and account preferences."
        breadcrumbs={[{ label: 'Account', to: '/account/profile' }, { label: 'Profile' }]}
      />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {status === 'loading' && <SkeletonLine className="h-96 w-full rounded-2xl" />}
        {status === 'error' && <ErrorState message={error} onRetry={refetch} />}
        {status === 'success' && data && (
          <div className="space-y-6">
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
                    onChange={update('email')}
                    className="h-11 w-full rounded-xl border border-app-border px-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
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
                    value={data.joinedOn}
                    readOnly
                    className="h-11 w-full rounded-xl border border-app-border bg-app-background px-3 text-sm text-text-secondary"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button type="submit">
                  <Save size={16} aria-hidden="true" />
                  Save changes
                </Button>
              </div>
            </form>

            <section className="rounded-2xl border border-app-border bg-surface p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
                <KeyRound size={18} className="text-brand-primary" aria-hidden="true" />
                Security
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                Password change will be connected to the authenticated API in Phase 3.
              </p>
              <Button className="mt-4" variant="outline" disabled>
                Change password
              </Button>
            </section>
          </div>
        )}
      </div>
    </>
  )
}
