import { ArrowRight, HeartHandshake, Leaf, ShieldCheck, Sprout, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../../components/Button.jsx'
import PageHeader from '../../components/PageHeader.jsx'

const values = [
  { icon: Leaf, title: 'Freshness first', text: 'We prioritize produce that looks, smells and tastes genuinely fresh.' },
  { icon: ShieldCheck, title: 'Quality you trust', text: 'Every order is checked before it leaves the packing station.' },
  { icon: Truck, title: 'Reliable delivery', text: 'Clear slots and dependable service for busy everyday schedules.' },
  { icon: HeartHandshake, title: 'Customer care', text: 'Helpful support with straightforward resolutions when something goes wrong.' },
]

export default function AboutUsPage() {
  return (
    <>
      <PageHeader
        title="About FreshCart"
        description="A simpler, fresher way to shop for the groceries your home needs."
        breadcrumbs={[{ label: 'About us' }]}
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-secondary px-3 py-1 text-xs font-semibold text-brand-dark">
              <Sprout size={14} aria-hidden="true" />
              Our story
            </span>
            <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
              Built around the everyday need for good food.
            </h2>
            <p className="mt-5 text-sm leading-7 text-text-secondary">
              FreshCart started with a simple idea: buying groceries online should
              feel as reassuring as visiting a trusted local market. We bring
              carefully selected produce, pantry staples and daily essentials into
              one clean, dependable shopping experience.
            </p>
            <p className="mt-4 text-sm leading-7 text-text-secondary">
              This project is also a learning platform. Every phase adds a real
              engineering capability — from REST APIs and secure payments to AWS
              hosting and monitoring.
            </p>
            <Button as={Link} to="/shop" className="mt-7">
              Explore the shop
              <ArrowRight size={16} aria-hidden="true" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: '2,400+', label: 'Happy homes' },
              { value: '250+', label: 'Fresh products' },
              { value: '8', label: 'Categories' },
              { value: '24/7', label: 'Order access' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-app-border bg-surface p-6 text-center shadow-sm">
                <p className="text-2xl font-bold text-brand-primary">{item.value}</p>
                <p className="mt-1 text-sm text-text-secondary">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <section className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight">What we stand for</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {values.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-app-border bg-surface p-6 shadow-sm">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-secondary text-brand-dark">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-text-secondary">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
