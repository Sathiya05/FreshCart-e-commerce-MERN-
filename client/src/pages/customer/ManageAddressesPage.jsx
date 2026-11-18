import { useEffect, useState } from 'react'
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
import { getDemoAddresses } from '../../services/account.service.js'

const emptyForm = {
  fullName: '',
  phone: '',
  addressLine: '',
  city: '',
  state: '',
  pincode: '',
  addressType: 'Home',
}

export default function ManageAddressesPage() {
  const dispatch = useAppDispatch()
  const { status, data, error, refetch } = useAsync(getDemoAddresses, [])
  const [addresses, setAddresses] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [addressToDelete, setAddressToDelete] = useState(null)

  useEffect(() => {
    if (data) setAddresses(data)
  }, [data])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (address) => {
    setEditing(address)
    setForm(address)
    setModalOpen(true)
  }

  const update = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }))

  const handleSubmit = (event) => {
    event.preventDefault()
    if (editing) {
      setAddresses((current) =>
        current.map((address) =>
          address.id === editing.id ? { ...address, ...form } : address,
        ),
      )
      dispatch(pushToast({ title: 'Address updated', message: 'Changes saved in this demo session.' }))
    } else {
      setAddresses((current) => [
        ...current,
        { ...form, id: `addr-${Date.now()}`, isDefault: current.length === 0 },
      ])
      dispatch(pushToast({ title: 'Address added', message: 'Your new address is ready to use.' }))
    }
    setModalOpen(false)
  }

  const handleDelete = (address) => {
    setAddresses((current) => current.filter((item) => item.id !== address.id))
    dispatch(pushToast({ type: 'info', message: 'Address removed.' }))
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
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit address' : 'Add a new address'}
        description="Address changes are stored locally in this Phase 2 preview."
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" form="address-form">Save address</Button>
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
          <div className="sm:col-span-2">
            <label htmlFor="address-pincode" className="mb-1.5 block text-sm font-medium">Pincode</label>
            <input id="address-pincode" required value={form.pincode} onChange={update('pincode')} className="h-11 w-full rounded-xl border border-app-border px-3 text-sm outline-none focus:border-brand-primary" />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(addressToDelete)}
        onClose={() => setAddressToDelete(null)}
        onConfirm={() => handleDelete(addressToDelete)}
        title="Delete this address?"
        message="It will no longer be available for checkout in this demo session."
        confirmLabel="Delete address"
      />
    </>
  )
}
