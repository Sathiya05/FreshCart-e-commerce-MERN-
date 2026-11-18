import { Link } from 'react-router-dom'
import PageHeader from '../../components/PageHeader.jsx'

const groups = [
  {
    title: 'Shopping',
    items: [
      {
        q: 'How do I find a specific product?',
        a: 'Use the search bar in the navigation, or open the Shop page and filter by category, price and availability.',
      },
      {
        q: 'Can I save products for later?',
        a: 'Yes. Select the heart icon on any product card to add it to your wishlist. You can move saved items to the cart at any time.',
      },
      {
        q: 'Are the prices final at checkout?',
        a: 'In this Phase 2 preview, prices are demo values. In the finished platform, all totals and discounts are calculated on the backend before payment.',
      },
    ],
  },
  {
    title: 'Delivery',
    items: [
      {
        q: 'What are delivery slots?',
        a: 'Delivery slots are selected time windows for receiving your groceries. You can choose one during checkout once real order creation is enabled.',
      },
      {
        q: 'Do you deliver on weekends?',
        a: 'Weekend availability depends on your location and the configured slots. The live schedule will appear in checkout after Phase 4.',
      },
    ],
  },
  {
    title: 'Payments and orders',
    items: [
      {
        q: 'Which payment methods will be supported?',
        a: 'Razorpay will support cards, UPI and net banking in Phase 5. Payment success or failure will only be trusted after server-side signature verification.',
      },
      {
        q: 'Can I track my order?',
        a: 'Yes. The My Orders area includes order details and tracking screens. Live status updates are connected after the admin order APIs are implemented.',
      },
    ],
  },
]

export default function FAQPage() {
  return (
    <>
      <PageHeader
        title="Frequently asked questions"
        description="Quick answers about shopping, delivery, payments and orders."
        breadcrumbs={[{ label: 'FAQ' }]}
      />
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.title}>
              <h2 className="text-xl font-semibold text-text-primary">{group.title}</h2>
              <div className="mt-4 space-y-3">
                {group.items.map((item) => (
                  <details key={item.q} className="group rounded-2xl border border-app-border bg-surface p-5">
                    <summary className="cursor-pointer list-none font-medium text-text-primary marker:hidden">
                      <span className="flex items-center justify-between gap-4">
                        {item.q}
                        <span className="text-brand-primary group-open:rotate-45">+</span>
                      </span>
                    </summary>
                    <p className="mt-3 text-sm leading-7 text-text-secondary">{item.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-brand-primary bg-brand-secondary/50 p-6 text-center">
          <p className="font-semibold text-brand-dark">Still need help?</p>
          <p className="mt-1 text-sm text-brand-dark">Our support team is ready to assist.</p>
          <Link to="/contact" className="mt-4 inline-flex rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">
            Contact support
          </Link>
        </div>
      </div>
    </>
  )
}
