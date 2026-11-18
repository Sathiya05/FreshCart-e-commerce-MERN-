import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  HeartHandshake,
  Leaf,
  Recycle,
  ShieldCheck,
  Sprout,
  Star,
  Truck,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../../components/Button.jsx'
import CategoryCard from '../../components/CategoryCard.jsx'
import DemoBadge from '../../components/DemoBadge.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import Newsletter from '../../components/Newsletter.jsx'
import { ProductGridSkeleton } from '../../components/Skeleton.jsx'
import ProductGrid from '../../components/ProductGrid.jsx'
import SectionHeading from '../../components/SectionHeading.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { getHomePageData } from '../../services/catalog.service.js'

const heroImage =
  'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1400&q=85'

const promises = [
  { icon: Leaf, title: 'Farm fresh daily', text: 'Picked and packed at peak freshness.' },
  { icon: Truck, title: 'On-time delivery', text: 'Slots that fit your everyday routine.' },
  { icon: ShieldCheck, title: 'Quality checked', text: 'Every item inspected before dispatch.' },
  { icon: HeartHandshake, title: 'Friendly support', text: 'Real help when you need it.' },
]

const testimonials = [
  {
    name: 'Ananya Sharma',
    role: 'Home chef',
    quote: 'The vegetables arrive looking like they came straight from the market. FreshCart has become our weekly shopping habit.',
    initials: 'AS',
  },
  {
    name: 'Rahul Menon',
    role: 'Working professional',
    quote: 'Delivery slots are reliable and the product quality is consistent. The checkout experience is refreshingly simple.',
    initials: 'RM',
  },
  {
    name: 'Meera Iyer',
    role: 'Mother of two',
    quote: 'I can trust the dairy and produce here. Everything is packed neatly and the support team is very responsive.',
    initials: 'MI',
  },
]

export default function HomePage() {
  const { status, data, error, refetch } = useAsync(getHomePageData, [])

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 sm:pt-10">
        <div className="relative overflow-hidden rounded-3xl bg-brand-dark text-white">
          <div className="grid items-center gap-8 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="p-8 sm:p-12 lg:py-16">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-accent">
                  <Sprout size={14} aria-hidden="true" />
                  Fresh from local farms
                </span>
                <DemoBadge className="border-white/20 bg-white/10 text-green-100" />
              </div>
              <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
                Groceries that feel
                <span className="block text-brand-accent">fresh every day.</span>
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-green-100">
                Shop vegetables, fruits, dairy, bakery and pantry essentials from
                trusted sources — delivered on your schedule.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button as={Link} to="/shop" size="lg" variant="accent">
                  Start shopping
                  <ArrowRight size={18} aria-hidden="true" />
                </Button>
                <Button
                  as={Link}
                  to="/categories"
                  size="lg"
                  className="border border-white/25 bg-white/10 text-white hover:bg-white/20"
                >
                  Browse categories
                </Button>
              </div>
              <div className="mt-10 flex flex-wrap gap-6 text-sm text-green-100">
                <span className="inline-flex items-center gap-2"><BadgeCheck size={17} aria-hidden="true" /> Quality guaranteed</span>
                <span className="inline-flex items-center gap-2"><Clock3 size={17} aria-hidden="true" /> Easy delivery slots</span>
              </div>
            </div>
            <div className="relative h-64 sm:h-80 lg:h-full lg:min-h-[520px]">
              <img
                src={heroImage}
                alt="Fresh grocery produce at a market"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark/20 to-transparent lg:from-brand-dark/20" />
              <div className="absolute bottom-6 right-6 hidden rounded-2xl bg-white/95 p-4 text-text-primary shadow-lg sm:block">
                <p className="text-xs text-text-secondary">Delivered fresh today</p>
                <p className="mt-1 text-lg font-bold text-brand-dark">2,400+ happy homes</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {status === 'error' && (
        <div className="mx-auto mt-10 max-w-7xl px-4 sm:px-6">
          <ErrorState message={error} onRetry={refetch} />
        </div>
      )}

      {status === 'loading' && (
        <div className="mx-auto max-w-7xl space-y-12 px-4 py-14 sm:px-6">
          <div className="space-y-4">
            <div className="h-8 w-56 animate-pulse rounded-lg bg-app-border" />
            <ProductGridSkeleton count={4} />
          </div>
          <ProductGridSkeleton count={8} />
        </div>
      )}

      {status === 'success' && data && (
        <>
          <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
            <SectionHeading
              eyebrow="Shop by category"
              title="Popular categories"
              description="Everything you need for a well-stocked kitchen, neatly organised."
              action={{ label: 'View all categories', to: '/categories' }}
            />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {data.categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
            <SectionHeading
              eyebrow="Handpicked for you"
              title="Featured products"
              description="Trusted favorites chosen for freshness, value and everyday usefulness."
              action={{ label: 'Shop all products', to: '/shop' }}
            />
            <ProductGrid products={data.featured} />
          </section>

          <section className="bg-white py-14">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <SectionHeading
                eyebrow="Limited time"
                title="Daily deals"
                description="Great produce at even better prices, while stocks last."
                action={{ label: 'See all deals', to: '/shop?sort=price-asc' }}
              />
              <ProductGrid products={data.deals} columns={4} />
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
            <SectionHeading
              eyebrow="From the farm"
              title="Fresh vegetables"
              description="Crisp, colorful and packed with natural goodness."
              action={{ label: 'Shop vegetables', to: '/categories/vegetables' }}
            />
            <ProductGrid products={data.vegetables} />
          </section>

          <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
            <SectionHeading
              eyebrow="Sweet and seasonal"
              title="Fresh fruits"
              description="Naturally ripe fruits for snacking, breakfast and desserts."
              action={{ label: 'Shop fruits', to: '/categories/fruits' }}
            />
            <ProductGrid products={data.fruits} />
          </section>

          <section className="bg-white py-14">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <SectionHeading
                eyebrow="Customer favorites"
                title="Best sellers"
                description="The groceries our customers reorder again and again."
              />
              <ProductGrid products={data.bestSellers} />
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
            <SectionHeading
              eyebrow="Why FreshCart"
              title="A better way to buy groceries"
              description="Thoughtful details that make everyday shopping simpler."
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {promises.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl border border-app-border bg-surface p-6 shadow-sm">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-secondary text-brand-dark">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-semibold text-text-primary">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">{text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
            <div className="grid overflow-hidden rounded-3xl bg-brand-primary text-white lg:grid-cols-2">
              <div className="p-8 sm:p-12">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-accent">
                  FreshCart promise
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                  Freshness you can see. Quality you can trust.
                </h2>
                <p className="mt-4 max-w-lg text-sm leading-7 text-green-50">
                  If something is not right with your order, tell us within 24 hours.
                  We will make it right with a replacement or refund once real orders
                  are enabled in Phase 4.
                </p>
                <Button as={Link} to="/about" variant="accent" className="mt-7">
                  Learn more
                  <ArrowRight size={16} aria-hidden="true" />
                </Button>
              </div>
              <div className="relative min-h-64">
                <img
                  src={heroImage}
                  alt="Fresh produce collection"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-brand-primary/20" />
                <span className="absolute bottom-6 left-6 inline-flex items-center gap-2 rounded-xl bg-white/95 px-4 py-3 text-sm font-semibold text-brand-dark">
                  <Recycle size={17} aria-hidden="true" />
                  Eco-friendly packaging
                </span>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
            <SectionHeading
              eyebrow="Customer stories"
              title="Loved by fresh food lovers"
            />
            <div className="grid gap-5 lg:grid-cols-3">
              {testimonials.map((item) => (
                <figure key={item.name} className="rounded-2xl border border-app-border bg-surface p-6 shadow-sm">
                  <div className="flex gap-1 text-brand-accent" aria-label="5 out of 5 stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} size={15} className="fill-current" aria-hidden="true" />
                    ))}
                  </div>
                  <blockquote className="mt-4 text-sm leading-7 text-text-secondary">
                    “{item.quote}”
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-secondary text-sm font-bold text-brand-dark">
                      {item.initials}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-text-primary">{item.name}</span>
                      <span className="text-xs text-text-secondary">{item.role}</span>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
            <Newsletter />
          </section>
        </>
      )}
    </>
  )
}
