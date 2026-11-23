import { useEffect, useState } from 'react'
import { Bell, CreditCard, RotateCcw, Save, Store, Truck } from 'lucide-react'
import AdminPageHeader from '../../components/AdminPageHeader.jsx'
import Badge from '../../components/Badge.jsx'
import Button from '../../components/Button.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import { SkeletonLine } from '../../components/Skeleton.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { getAdminSettings, updateAdminSettings } from '../../services/admin.service.js'
import { useAppDispatch } from '../../redux/hooks.js'
import { pushToast } from '../../redux/uiSlice.js'

const initialSettings = {
  storeName: 'FreshCart',
  supportEmail: 'support@freshcart.example',
  supportPhone: '',
  currency: 'INR',
  freeDeliveryAbove: '999',
  defaultDeliveryFee: '30',
  lowStockThreshold: '20',
  orderNotifications: true,
  lowStockAlerts: true,
  weeklySummary: false,
}

export default function AdminSettingsPage() {
  const dispatch = useAppDispatch()
  const { status, data, error, refetch } = useAsync(getAdminSettings, [])
  const [settings, setSettings] = useState(initialSettings)
  const [resetOpen, setResetOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (data) setSettings(data)
  }, [data])

  const update = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setSettings((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      const saved = await updateAdminSettings({
        ...settings,
        freeDeliveryAbove: Number(settings.freeDeliveryAbove) || 0,
        defaultDeliveryFee: Number(settings.defaultDeliveryFee) || 0,
        lowStockThreshold: Number(settings.lowStockThreshold) || 1,
      })
      setSettings(saved)
      dispatch(pushToast({ title: 'Settings saved', message: 'Store settings were updated.' }))
    } catch (apiError) {
      dispatch(pushToast({
        type: 'error',
        title: 'Could not save settings',
        message: apiError?.message || 'Please try again.',
      }))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Settings"
        description="Storefront and delivery preferences saved on the server."
        actions={
          <Button variant="outline" onClick={() => setResetOpen(true)}>
            <RotateCcw size={16} aria-hidden="true" />
            Reset values
          </Button>
        }
      />

      {status === 'loading' && <SkeletonLine className="h-96 w-full rounded-2xl" />}
      {status === 'error' && <ErrorState message={error} onRetry={refetch} />}
      {status === 'success' && (
      <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-app-border bg-surface p-5 shadow-sm">
            <div className="flex items-center gap-3 border-b border-app-border pb-4">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-secondary text-brand-dark">
                <Store size={19} aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-semibold text-text-primary">Store profile</h2>
                <p className="text-xs text-text-secondary">Shown across the storefront and emails.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="setting-store-name" className="mb-1.5 block text-sm font-medium">Store name</label>
                <input
                  id="setting-store-name"
                  required
                  value={settings.storeName}
                  onChange={update('storeName')}
                  className="h-11 w-full rounded-xl border border-app-border px-3 text-sm outline-none focus:border-brand-primary"
                />
              </div>
              <div>
                <label htmlFor="setting-currency" className="mb-1.5 block text-sm font-medium">Currency</label>
                <select
                  id="setting-currency"
                  value={settings.currency}
                  onChange={update('currency')}
                  className="h-11 w-full rounded-xl border border-app-border px-3 text-sm outline-none focus:border-brand-primary"
                >
                  <option value="INR">INR — Indian Rupee</option>
                </select>
              </div>
              <div>
                <label htmlFor="setting-email" className="mb-1.5 block text-sm font-medium">Support email</label>
                <input
                  id="setting-email"
                  type="email"
                  required
                  value={settings.supportEmail}
                  onChange={update('supportEmail')}
                  className="h-11 w-full rounded-xl border border-app-border px-3 text-sm outline-none focus:border-brand-primary"
                />
              </div>
              <div>
                <label htmlFor="setting-phone" className="mb-1.5 block text-sm font-medium">Support phone</label>
                <input
                  id="setting-phone"
                  required
                  value={settings.supportPhone}
                  onChange={update('supportPhone')}
                  className="h-11 w-full rounded-xl border border-app-border px-3 text-sm outline-none focus:border-brand-primary"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-app-border bg-surface p-5 shadow-sm">
            <div className="flex items-center gap-3 border-b border-app-border pb-4">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700">
                <Truck size={19} aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-semibold text-text-primary">Delivery</h2>
                <p className="text-xs text-text-secondary">Demo thresholds and delivery fees.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="setting-free-delivery" className="mb-1.5 block text-sm font-medium">
                  Free delivery above
                </label>
                <input
                  id="setting-free-delivery"
                  type="number"
                  min="0"
                  value={settings.freeDeliveryAbove}
                  onChange={update('freeDeliveryAbove')}
                  className="h-11 w-full rounded-xl border border-app-border px-3 text-sm outline-none focus:border-brand-primary"
                />
              </div>
              <div>
                <label htmlFor="setting-delivery-fee" className="mb-1.5 block text-sm font-medium">
                  Default delivery fee
                </label>
                <input
                  id="setting-delivery-fee"
                  type="number"
                  min="0"
                  value={settings.defaultDeliveryFee}
                  onChange={update('defaultDeliveryFee')}
                  className="h-11 w-full rounded-xl border border-app-border px-3 text-sm outline-none focus:border-brand-primary"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-app-border bg-surface p-5 shadow-sm">
            <div className="flex items-center gap-3 border-b border-app-border pb-4">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700">
                <Bell size={19} aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-semibold text-text-primary">Notifications</h2>
                <p className="text-xs text-text-secondary">Choose which alerts are enabled.</p>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {[
                { field: 'orderNotifications', label: 'New order notifications', hint: 'Show a toast when an order arrives.' },
                { field: 'lowStockAlerts', label: 'Low-stock alerts', hint: 'Highlight products with limited stock.' },
                { field: 'weeklySummary', label: 'Weekly summary email', hint: 'Available after email delivery is configured.' },
              ].map((item) => (
                <label key={item.field} className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={settings[item.field]}
                    onChange={update(item.field)}
                    className="mt-1 h-4 w-4 rounded border-app-border text-brand-primary focus:ring-brand-primary"
                  />
                  <span>
                    <span className="block text-sm font-medium">{item.label}</span>
                    <span className="block text-xs text-text-secondary">{item.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-app-border bg-surface p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-secondary text-brand-dark">
                <CreditCard size={19} aria-hidden="true" />
              </span>
              <h2 className="font-semibold text-text-primary">Payments</h2>
            </div>
            <p className="mt-4 text-sm leading-6 text-text-secondary">
              Razorpay keys and the webhook secret are configured on the server
              through environment variables. No payment credentials are collected
              in this admin screen.
            </p>
            <div className="mt-4">
              <Badge tone="success">Server-side integration active</Badge>
            </div>
          </section>

          <section className="rounded-2xl border border-app-border bg-surface p-5 shadow-sm">
            <h2 className="font-semibold text-text-primary">Inventory alerts</h2>
            <p className="mt-2 text-sm text-text-secondary">
              Alert when stock falls below {settings.lowStockThreshold || 0} units.
            </p>
            <div className="mt-4">
              <label htmlFor="setting-low-stock" className="mb-1.5 block text-sm font-medium">
                Low-stock threshold
              </label>
              <input
                id="setting-low-stock"
                type="number"
                min="1"
                value={settings.lowStockThreshold}
                onChange={update('lowStockThreshold')}
                className="h-11 w-full rounded-xl border border-app-border px-3 text-sm outline-none focus:border-brand-primary"
              />
            </div>
          </section>

          <div className="sticky bottom-4 z-10 mt-6 rounded-xl bg-surface/95 p-2 backdrop-blur sm:static sm:mt-0 sm:rounded-none sm:bg-transparent sm:p-0">
            <Button type="submit" className="w-full" size="lg" disabled={saving}>
              <Save size={16} aria-hidden="true" />
              {saving ? 'Saving…' : 'Save settings'}
            </Button>
          </div>
          <p className="text-center text-xs text-text-secondary">
            Changes are saved to the FreshCart database.
          </p>
        </div>
      </form>
      )}

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={() => {
          setSettings(initialSettings)
          dispatch(pushToast({ type: 'info', message: 'Default values restored. Save to apply them.' }))
        }}
        title="Reset settings?"
        message="All unsaved changes in this form will be replaced with the default values."
        confirmLabel="Reset values"
      />
    </>
  )
}
