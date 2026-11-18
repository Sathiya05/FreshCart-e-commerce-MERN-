import { useState } from 'react'
import { Bell, CreditCard, RotateCcw, Save, Store, Truck } from 'lucide-react'
import AdminPageHeader from '../../components/AdminPageHeader.jsx'
import Badge from '../../components/Badge.jsx'
import Button from '../../components/Button.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import { DEMO_APP } from '../../data/demoData.js'
import { useAppDispatch } from '../../redux/hooks.js'
import { pushToast } from '../../redux/uiSlice.js'

const initialSettings = {
  storeName: DEMO_APP.name,
  supportEmail: DEMO_APP.supportEmail,
  supportPhone: DEMO_APP.supportPhone,
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
  const [settings, setSettings] = useState(initialSettings)
  const [resetOpen, setResetOpen] = useState(false)

  const update = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setSettings((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    dispatch(
      pushToast({
        type: 'info',
        message: 'Settings saved for this demo session. Persistence arrives with the Phase 3 API.',
      }),
    )
  }

  return (
    <>
      <AdminPageHeader
        title="Settings"
        description="Configure storefront details and demo preferences."
        actions={
          <Button variant="outline" onClick={() => setResetOpen(true)}>
            <RotateCcw size={16} aria-hidden="true" />
            Reset demo values
          </Button>
        }
      />

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
                <p className="text-xs text-text-secondary">Choose which demo alerts appear.</p>
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
              Razorpay keys, webhooks and settlement settings will be configured here
              in Phase 5. No payment credentials are collected in this demo.
            </p>
            <div className="mt-4">
              <Badge tone="warning">Phase 5 integration pending</Badge>
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

          <Button type="submit" className="w-full" size="lg">
            <Save size={16} aria-hidden="true" />
            Save demo settings
          </Button>
          <p className="text-center text-xs text-text-secondary">
            Changes stay in local UI state until the settings API is built.
          </p>
        </div>
      </form>

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={() => {
          setSettings(initialSettings)
          dispatch(pushToast({ type: 'info', message: 'Demo settings restored to defaults.' }))
        }}
        title="Reset demo settings?"
        message="All unsaved changes in this form will be replaced with the original demo values."
        confirmLabel="Reset values"
      />
    </>
  )
}
