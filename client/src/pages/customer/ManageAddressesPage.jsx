import { useState } from 'react'
import { Plus } from 'lucide-react'
import AddressCard from '../../components/AddressCard.jsx'
import Button from '../../components/Button.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import Modal from '../../components/Modal.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import { SkeletonLine } from '../../components/Skeleton.jsx'
import { useAppDispatch } from '../../redux/hooks.js'
import { pushToast } from '../../redux/uiSlice.js'
import { useAsync } from '../../hooks/useAsync.js'
import {
  createAddress,
  deleteAddress,
  getAddresses,
  setDefaultAddress,
  updateAddress,
} from '../../services/commerce.service.js'

const emptyForm = {
  fullName: '',
  phone: '',
  addressLine: '',
  city: '',
  state: '',
  pincode: '',
  addressType: 'Home',
  isDefault: false,
}

export default function ManageAddressesPage() {
  const dispatch = useAppDispatch()
  const { status, data, error, refetch } = useAsync(getAddresses, [])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [addressToDelete, setAddressToDelete] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const addresses = data || []

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (address) => {
    setEditing(address)
    setForm({
      fullName: address.fullName || '',
      phone: address.phone || '',
      addressLine: address.addressLine || '',
      city: address.city || '',
      state: address.state || '',
      pincode: address.pincode || '',
      addressType: address.addressType || address.label || 'Home',
      isDefault: Boolean(address.isDefault),
    })
    setModalOpen(true)
  }

  const update = (field) => (event) =>
    setForm((current) => ({
      ...current,
      [field]: event.target.type === 'checkbox' ? event.target.checked : event.target.value,
    }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      if (editing) {
        await updateAddress(editing.id, form)
        dispatch(pushToast({ title: 'Address updated', message: 'Your changes are saved.' }))
      } else {
        await createAddress(form)
        dispatch(pushToast({ title: 'Address added', message: 'Your new address is ready to use.' }))
      }
      setModalOpen(false)
      await refetch()
    } catch (apiError) {
      dispatch(
        pushToast({
          type: 'error',
          title: 'Could not save address',
          message: apiError?.message || 'Please try again.',
        }),
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (address) => {
    try {
      await deleteAddress(address.id)
      dispatch(pushToast({ type: 'info', message: 'Address removed.' }))
      await refetch()
    } catch (apiError) {
      dispatch(
        pushToast({
          type: 'error',
          title: 'Could not delete address',
          message: apiError?.message || 'Please try again.',
        }),
      )
    }
  }

  const handleSetDefault = async (address) => {
    try {
      await setDefaultAddress(address.id)
      dispatch(pushToast({ title: 'Default updated', message: 'Checkout will use this address.' }))
      await refetch()
    } catch (apiError) {
      dispatch(
        pushToast({
          type: 'error',
          title: 'Could not set default',
          message: apiError?.message || 'Please try again.',
        }),
      )
    }
  }

  return (
    <>
      <PageHeader
        title="Manage addresses"
        description="Add and maintain delivery addresses for faster checkout."
        breadcrumbs={[{ label: 'Account', to: '/account/profile' }, { label: 'Addresses' }]}
        actions={
          <Button onClick={openCreate}>
            <Plus size={16} aria-hidden="true" />
            Add address
          </Button>
        }
      />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {status === 'loading' && (
          <div className="grid gap-4 md:grid-cols-2">
            <SkeletonLine className="h-48 rounded-2xl" />
            <SkeletonLine className="h-48 rounded-2xl" />
          </div>
        )}
        {status === 'error' && <ErrorState message={error} onRetry={refetch} />}
        {status === 'success' && addresses.length === 0 && (
          <EmptyState
            title="No addresses saved"
            description="Add an address to speed up your next checkout."
            actionLabel="Add address"
            onAction={openCreate}
          />
        )}
        {status === 'success' && addresses.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {addresses.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                onEdit={openEdit}
                onDelete={setAddressToDelete}
                onSetDefault={handleSetDefault}
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit address' : 'Add a new address'}
        description="Saved addresses are available at checkout."
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" form="address-form" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save address'}
            </Button>
          </>
        }
      >
        <form id="address-form" onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="address-name" className="mb-1.5 block text-sm font-medium">Full name</label>
            <input id="address-name" required value={form.fullName} onChange={update('fullName')} className="h-11 w-full rounded-xl border border-app-border px-3 text-sm outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label htmlFor="address-phone" className="mb-1.5 block text-sm font-medium">Phone</label>
            <input id="address-phone" required value={form.phone} onChange={update('phone')} className="h-11 w-full rounded-xl border border-app-border px-3 text-sm outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label htmlFor="address-type" className="mb-1.5 block text-sm font-medium">Address type</label>
            <select id="address-type" value={form.addressType} onChange={update('addressType')} className="h-11 w-full rounded-xl border border-app-border px-3 text-sm outline-none focus:border-brand-primary">
              <option>Home</option>
              <option>Work</option>
              <option>Other</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="address-line" className="mb-1.5 block text-sm font-medium">Address line</label>
            <input id="address-line" required value={form.addressLine} onChange={update('addressLine')} className="h-11 w-full rounded-xl border border-app-border px-3 text-sm outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label htmlFor="address-city" className="mb-1.5 block text-sm font-medium">City</label>
            <input id="address-city" required value={form.city} onChange={update('city')} className="h-11 w-full rounded-xl border border-app-border px-3 text-sm outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label htmlFor="address-state" className="mb-1.5 block text-sm font-medium">State</label>
            <input id="address-state" required value={form.state} onChange={update('state')} className="h-11 w-full rounded-xl border border-app-border px-3 text-sm outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label htmlFor="address-pincode" className="mb-1.5 block text-sm font-medium">Pincode</label>
            <input id="address-pincode" required value={form.pincode} onChange={update('pincode')} className="h-11 w-full rounded-xl border border-app-border px-3 text-sm outline-none focus:border-brand-primary" />
          </div>
          <label className="flex items-center gap-2 self-end sm:col-span-2">
            <input type="checkbox" checked={form.isDefault} onChange={update('isDefault')} className="h-4 w-4 accent-brand-primary" />
            <span className="text-sm text-text-secondary">Use as my default address</span>
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(addressToDelete)}
        onClose={() => setAddressToDelete(null)}
        onConfirm={() => handleDelete(addressToDelete)}
        title="Delete this address?"
        message="It will no longer be available for checkout."
        confirmLabel="Delete address"
      />
    </>
  )
}
