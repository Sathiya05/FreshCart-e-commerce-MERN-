import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import AdminPageHeader from '../../components/AdminPageHeader.jsx'
import Badge from '../../components/Badge.jsx'
import Button from '../../components/Button.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import Modal from '../../components/Modal.jsx'
import { SkeletonLine } from '../../components/Skeleton.jsx'
import { useAppDispatch } from '../../redux/hooks.js'
import { pushToast } from '../../redux/uiSlice.js'
import { useAsync } from '../../hooks/useAsync.js'
import { getApiErrorMessage } from '../../services/api.js'
import {
  createAdminCategory,
  deleteAdminCategory,
  getAdminCategories,
  updateAdminCategory,
} from '../../services/admin.service.js'

const emptyCategory = { name: '', description: '', image: '', isActive: true }

export default function AdminCategoriesPage() {
  const dispatch = useAppDispatch()
  const { status, data, error, refetch } = useAsync(getAdminCategories, [])
  const [categories, setCategories] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyCategory)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState(null)

  useEffect(() => {
    if (data) setCategories(data)
  }, [data])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyCategory)
    setFormError('')
    setModalOpen(true)
  }

  const openEdit = (category) => {
    setEditing(category)
    setForm({
      name: category.name,
      description: category.description || '',
      image: category.image || '',
      isActive: category.isActive !== false,
    })
    setFormError('')
    setModalOpen(true)
  }

  const update = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')
    setSaving(true)

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      image: form.image.trim(),
      isActive: form.isActive,
    }

    try {
      if (editing) {
        await updateAdminCategory(editing.id, payload)
        dispatch(pushToast({ title: 'Category updated', message: `${form.name} was saved.` }))
      } else {
        await createAdminCategory(payload)
        dispatch(pushToast({ title: 'Category added', message: `${form.name} was created.` }))
      }
      setModalOpen(false)
      refetch()
    } catch (apiError) {
      setFormError(getApiErrorMessage(apiError, 'Could not save this category.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!categoryToDelete) return
    setSaving(true)
    try {
      await deleteAdminCategory(categoryToDelete.id)
      dispatch(pushToast({ title: 'Category deleted', message: `${categoryToDelete.name} was removed.` }))
      setCategoryToDelete(null)
      refetch()
    } catch (apiError) {
      dispatch(pushToast({
        type: 'error',
        title: 'Delete failed',
        message: getApiErrorMessage(apiError, 'Could not delete this category.'),
      }))
      setCategoryToDelete(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Categories"
        description="Organize the live catalog into clear, shoppable groups."
        actions={<Button onClick={openCreate}><Plus size={16} aria-hidden="true" /> Add category</Button>}
      />

      {status === 'loading' && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => <SkeletonLine key={index} className="h-40 rounded-2xl" />)}
        </div>
      )}
      {status === 'error' && <ErrorState message={error} onRetry={refetch} />}
      {status === 'success' && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <article key={category.id} className="overflow-hidden rounded-2xl border border-app-border bg-surface shadow-sm">
              <img
                src={category.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'}
                alt={category.name}
                className="h-32 w-full object-cover"
              />
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="min-w-0 truncate font-semibold text-text-primary">{category.name}</h2>
                  <div className="shrink-0">
                    <Badge tone={category.isActive === false ? 'warning' : 'success'}>
                      {category.isActive === false ? 'Inactive' : 'Active'}
                    </Badge>
                  </div>
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-text-secondary">
                  {category.description || 'No description provided.'}
                </p>
                <p className="mt-3 truncate text-xs text-text-secondary">/{category.slug}</p>
                <div className="mt-4 flex gap-2">
                  <Button size="compact" variant="outline" onClick={() => openEdit(category)}>
                    <Pencil size={14} aria-hidden="true" /> Edit
                  </Button>
                  <Button size="compact" variant="ghost" className="text-red-600" onClick={() => setCategoryToDelete(category)}>
                    <Trash2 size={14} aria-hidden="true" /> Delete
                  </Button>
                </div>
              </div>
            </article>
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-text-secondary">No categories yet. Add your first one.</p>
          )}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit category' : 'Add a category'}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" form="category-form" disabled={saving}>
              {saving ? 'Saving…' : 'Save category'}
            </Button>
          </>
        }
      >
        <form id="category-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="category-name" className="mb-1.5 block text-sm font-medium">Name</label>
            <input id="category-name" required value={form.name} onChange={update('name')} className="h-11 w-full rounded-xl border border-app-border px-3 text-sm outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label htmlFor="category-description" className="mb-1.5 block text-sm font-medium">Description</label>
            <textarea id="category-description" rows="3" value={form.description} onChange={update('description')} className="w-full rounded-xl border border-app-border px-3 py-2 text-sm outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label htmlFor="category-image" className="mb-1.5 block text-sm font-medium">Image URL</label>
            <input id="category-image" type="url" value={form.image} onChange={update('image')} placeholder="https://…" className="h-11 w-full rounded-xl border border-app-border px-3 text-sm outline-none focus:border-brand-primary" />
          </div>
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
              className="accent-brand-primary"
            />
            Active category
          </label>
          {formError && <p className="text-sm text-red-600" role="alert">{formError}</p>}
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(categoryToDelete)}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleDelete}
        title="Delete this category?"
        message={`${categoryToDelete?.name || 'This category'} will be removed. Products using it must be reassigned first.`}
        confirmLabel={saving ? 'Deleting…' : 'Delete category'}
      />
    </>
  )
}
