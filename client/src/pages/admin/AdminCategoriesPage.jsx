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
import { slugify } from '../../utils/format.js'
import { useAsync } from '../../hooks/useAsync.js'
import { getAdminCategories } from '../../services/admin.service.js'

const emptyCategory = { name: '', description: '', image: '' }

export default function AdminCategoriesPage() {
  const dispatch = useAppDispatch()
  const { status, data, error, refetch } = useAsync(getAdminCategories, [])
  const [categories, setCategories] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyCategory)
  const [categoryToDelete, setCategoryToDelete] = useState(null)

  useEffect(() => {
    if (data) setCategories(data)
  }, [data])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyCategory)
    setModalOpen(true)
  }

  const openEdit = (category) => {
    setEditing(category)
    setForm({ name: category.name, description: category.description, image: category.image })
    setModalOpen(true)
  }

  const update = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }))

  const handleSubmit = (event) => {
    event.preventDefault()
    if (editing) {
      setCategories((current) =>
        current.map((item) => (item.id === editing.id ? { ...item, ...form, slug: slugify(form.name) } : item)),
      )
      dispatch(pushToast({ title: 'Category updated', message: 'Demo changes saved locally.' }))
    } else {
      setCategories((current) => [
        ...current,
        {
          id: `cat-demo-${Date.now()}`,
          slug: slugify(form.name),
          name: form.name,
          shortName: form.name,
          description: form.description,
          image: form.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
          productCount: 0,
          icon: 'Carrot',
          isActive: true,
        },
      ])
      dispatch(pushToast({ title: 'Category added', message: 'New demo category created.' }))
    }
    setModalOpen(false)
  }

  return (
    <>
      <AdminPageHeader
        title="Categories"
        description="Organize products into clear, shoppable groups."
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
              <img src={category.image} alt={category.name} className="h-32 w-full object-cover" />
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-semibold text-text-primary">{category.name}</h2>
                  <Badge tone="success">Active</Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-text-secondary">{category.description}</p>
                <p className="mt-3 text-xs text-text-secondary">{category.productCount} products · /{category.slug}</p>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(category)}>
                    <Pencil size={14} aria-hidden="true" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setCategoryToDelete(category)}>
                    <Trash2 size={14} aria-hidden="true" /> Delete
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit category' : 'Add a category'}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" form="category-form">Save category</Button>
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
            <input id="category-image" value={form.image} onChange={update('image')} placeholder="https://…" className="h-11 w-full rounded-xl border border-app-border px-3 text-sm outline-none focus:border-brand-primary" />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(categoryToDelete)}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={() => {
          setCategories((current) => current.filter((item) => item.id !== categoryToDelete.id))
          dispatch(pushToast({ type: 'info', message: 'Category removed from demo catalog.' }))
        }}
        title="Delete this category?"
        message={`${categoryToDelete?.name || 'This category'} will be removed. Products should be reassigned before real deletion.`}
        confirmLabel="Delete category"
      />
    </>
  )
}
