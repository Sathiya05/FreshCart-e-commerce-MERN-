import { useParams } from 'react-router-dom'
import EmptyState from '../../components/EmptyState.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import ProductGrid from '../../components/ProductGrid.jsx'
import { ProductGridSkeleton } from '../../components/Skeleton.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { getCategoryBySlug, getProducts } from '../../services/catalog.service.js'

export default function CategoryProductsPage() {
  const { slug } = useParams()

  const { status, data, error, refetch } = useAsync(async () => {
    const category = await getCategoryBySlug(slug)
    if (!category) return null
    const products = await getProducts({ category: category.id, limit: 12 })
    return { category, products: products.items }
  }, [slug])

  return (
    <>
      <PageHeader
        title={data?.category?.name || 'Category products'}
        description={data?.category?.description || 'Browse products in this category.'}
        breadcrumbs={[
          { label: 'Categories', to: '/categories' },
          { label: data?.category?.shortName || slug },
        ]}
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {status === 'loading' && <ProductGridSkeleton count={8} />}
        {status === 'error' && <ErrorState message={error} onRetry={refetch} />}
        {status === 'success' && !data && (
          <EmptyState
            title="Category not found"
            description="This category does not exist in the demo catalog."
            actionLabel="Browse all categories"
            actionTo="/categories"
          />
        )}
        {status === 'success' && data && data.products.length === 0 && (
          <EmptyState
            title="No products in this category"
            description="New items will appear here once they are added."
            actionLabel="Shop all products"
            actionTo="/shop"
          />
        )}
        {status === 'success' && data && data.products.length > 0 && (
          <>
            <p className="mb-5 text-sm text-text-secondary">
              {data.products.length} products in {data.category.name}
            </p>
            <ProductGrid products={data.products} />
          </>
        )}
      </div>
    </>
  )
}
