import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Search, Trash2, Upload } from 'lucide-react'
import { Link } from 'react-router-dom'
import AdminPageHeader from '../../components/AdminPageHeader.jsx'
import Badge from '../../components/Badge.jsx'
import Button from '../../components/Button.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import DataTable from '../../components/DataTable.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import Modal from '../../components/Modal.jsx'
import { TableSkeleton } from '../../components/Skeleton.jsx'
import { useAppDispatch } from '../../redux/hooks.js'
import { pushToast } from '../../redux/uiSlice.js'
import { formatCurrency } from '../../utils/format.js'
import { useAsync } from '../../hooks/useAsync.js'
import { getApiErrorMessage } from '../../services/api.js'
import {
  createAdminProduct,
  deleteAdminProduct,
  getAdminCategories,
  getAdminProducts,
  updateAdminProduct,
} from '../../services/admin.service.js'

const emptyProduct = {
  name: '',
  categoryId: '',
  price: '',
  stock: '',
  unit: '1 kg',
  image: '',
}

const toPayload = (form) => ({
  name: form.name.trim(),
  category: form.categoryId,
  price: Number(form.price),
  stock: Number(form.stock),
  unit: form.unit.trim(),
  images: form.image.trim() ? [form.image.trim()] : [],
})

export default function AdminProductsPage() {
  const dispatch = useAppDispatch()
  const productsState = useAsync(getAdminProducts, [])
  const categoriesState = useAsync(getAdminCategories, [])
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [stockFilter, setStockFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyProduct)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [productToDelete, setProductToDelete] = useState(null)

  useEffect(() => {
    if (productsState.data) setProducts(productsState.data.items)
  }, [productsState.data])

  const categories = categoriesState.data || []

  const filtered = useMemo(
    () =>
      products.filter((product) => {
        const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase())
        const matchesStock =
          stockFilter === 'all' ||
          (stockFilter === 'low' && product.stock <= 20) ||
          (stockFilter === 'out' && product.stock === 0) ||
          (stockFilter === 'healthy' && product.stock > 20)
        return matchesSearch && matchesStock
      }),
    [products, search, stockFilter],
  )

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyProduct, categoryId: categories[0]?.id || '' })
    setFormError('')
    setModalOpen(true)
  }

  const openEdit = (product) => {
    setEditing(product)
    setForm({
      name: product.name,
      categoryId: product.categoryId,
      price: product.price,
      stock: product.stock,
      unit: product.unit || '1 kg',
      image: product.image || '',
    })
    setFormError('')
    setModalOpen(true)
  }

  const update = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')

    if (!form.categoryId) {
      setFormError('Choose a category before saving.')
      return
    }
    if (!form.image.trim()) {
      setFormError('An image URL is required.')
      return
    }

    setSaving(true)
    try {
      if (editing) {
        await updateAdminProduct(editing.id, toPayload(form))
        dispatch(pushToast({ title: 'Product updated', message: `${form.name} was saved.` }))
      } else {
        await createAdminProduct(toPayload(form))
        dispatch(pushToast({ title: 'Product added', message: `${form.name} was created.` }))
      }
      setModalOpen(false)
      productsState.refetch()
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Could not save this product.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!productToDelete) return
    setSaving(true)
    try {
      await deleteAdminProduct(productToDelete.id)
      dispatch(pushToast({ title: 'Product deleted', message: `${productToDelete.name} was removed.` }))
      setProductToDelete(null)
      productsState.refetch()
    } catch (error) {
      dispatch(pushToast({
        type: 'error',
        title: 'Delete failed',
        message: getApiErrorMessage(error, 'Could not delete this product.'),
      }))
      setProductToDelete(null)
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    {
      key: 'name',
      label: 'Product',
      render: (row) => (
        <div className="flex items-center gap-3">
          <img src={row.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
          <div>
            <p className="font-medium text-text-primary">{row.name}</p>
            <p className="text-xs text-text-secondary">{row.sku || 'No SKU'}</p>
          </div>
        </div>
      ),
    },
    { key: 'category', label: 'Category', render: (row) => row.categoryName },
    { key: 'price', label: 'Price', render: (row) => formatCurrency(row.discountPrice || row.price) },
    {
      key: 'stock',
      label: 'Stock',
      render: (row) => (
        <Badge tone={row.stock <= 15 ? 'danger' : row.stock <= 30 ? 'warning' : 'success'}>
          {row.stock} units
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-1">
          <button type="button" onClick={() => openEdit(row)} className="rounded-lg p-2 text-text-secondary hover:bg-app-background hover:text-brand-primary" aria-label={`Edit ${row.name}`}>
            <Pencil size={15} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => setProductToDelete(row)} className="rounded-lg p-2 text-text-secondary hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${row.name}`}>
            <Trash2 size={15} aria-hidden="true" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <AdminPageHeader
        title="Products"
        description="Add, edit and monitor the live grocery catalog."
        actions={
          <>
            <Button variant="outline" onClick={() => dispatch(pushToast({ type: 'info', message: 'File uploads need AWS storage in Phase 6. Paste an image URL for now.' }))}>
              <Upload size={16} aria-hidden="true" />
              Upload images
            </Button>
            <Button onClick={openCreate}>
              <Plus size={16} aria-hidden="true" />
              Add product
            </Button>
          </>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products…"
            aria-label="Search products"
            className="h-11 w-full rounded-xl border border-app-border bg-surface pl-9 pr-3 text-sm outline-none focus:border-brand-primary"
          />
        </div>
        <select
          value={stockFilter}
          onChange={(event) => setStockFilter(event.target.value)}
          aria-label="Filter by stock"
          className="h-11 rounded-xl border border-app-border bg-surface px-3 text-sm outline-none focus:border-brand-primary"
        >
          <option value="all">All stock levels</option>
          <option value="healthy">Healthy stock</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </select>
      </div>

      {categoriesState.isError && (
        <div className="mb-4">
          <ErrorState message={categoriesState.error} onRetry={categoriesState.refetch} />
        </div>
      )}
      {categoriesState.status === 'success' && categories.length === 0 && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Add a <Link to="/admin/categories" className="font-semibold underline">category</Link> first — every product needs one.
        </div>
      )}
      {productsState.isLoading && <TableSkeleton rows={6} columns={5} />}
      {productsState.isError && <ErrorState message={productsState.error} onRetry={productsState.refetch} />}
      {productsState.status === 'success' && (
        <DataTable columns={columns} rows={filtered} emptyMessage="No products match your filters." />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit product' : 'Add a product'}
        description="Changes are saved directly to the API."
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" form="product-form" disabled={saving}>
              {saving ? 'Saving…' : 'Save product'}
            </Button>
          </>
        }
      >
        <form id="product-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="product-name" className="mb-1.5 block text-sm font-medium">Product name</label>
            <input id="product-name" required value={form.name} onChange={update('name')} className="h-11 w-full rounded-xl border border-app-border px-3 text-sm outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label htmlFor="product-category" className="mb-1.5 block text-sm font-medium">Category</label>
            <select id="product-category" required value={form.categoryId} onChange={update('categoryId')} className="h-11 w-full rounded-xl border border-app-border px-3 text-sm outline-none focus:border-brand-primary">
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="product-price" className="mb-1.5 block text-sm font-medium">Price</label>
              <input id="product-price" type="number" min="0" step="0.01" required value={form.price} onChange={update('price')} className="h-11 w-full rounded-xl border border-app-border px-3 text-sm outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label htmlFor="product-stock" className="mb-1.5 block text-sm font-medium">Stock</label>
              <input id="product-stock" type="number" min="0" step="1" required value={form.stock} onChange={update('stock')} className="h-11 w-full rounded-xl border border-app-border px-3 text-sm outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label htmlFor="product-unit" className="mb-1.5 block text-sm font-medium">Unit</label>
              <input id="product-unit" required value={form.unit} onChange={update('unit')} className="h-11 w-full rounded-xl border border-app-border px-3 text-sm outline-none focus:border-brand-primary" />
            </div>
          </div>
          <div>
            <label htmlFor="product-image" className="mb-1.5 block text-sm font-medium">Image URL</label>
            <input id="product-image" type="url" required value={form.image} onChange={update('image')} placeholder="https://images.unsplash.com/…" className="h-11 w-full rounded-xl border border-app-border px-3 text-sm outline-none focus:border-brand-primary" />
            <p className="mt-1.5 text-xs text-text-secondary">
              Paste a public image URL. File uploads need AWS storage in Phase 6.
            </p>
          </div>
          {formError && <p className="text-sm text-red-600" role="alert">{formError}</p>}
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleDelete}
        title="Delete this product?"
        message={`${productToDelete?.name || 'This product'} will be permanently removed from the catalog.`}
        confirmLabel={saving ? 'Deleting…' : 'Delete product'}
      />
    </>
  )
}
