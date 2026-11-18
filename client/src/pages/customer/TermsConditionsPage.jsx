import PageHeader from '../../components/PageHeader.jsx'

const sections = [
  {
    title: 'Use of the platform',
    body: 'FreshCart is intended for lawful personal or household grocery shopping. You agree to provide accurate account and delivery information, and to keep your credentials secure.',
  },
  {
    title: 'Products and pricing',
    body: 'Product availability, images, units and prices come from the live catalog API. Checkout totals are not final until server-side order validation and payment confirmation are connected.',
  },
  {
    title: 'Orders and delivery',
    body: 'An order is confirmed only after server-side validation and successful payment confirmation. Delivery slots are subject to availability and may change if circumstances require it.',
  },
  {
    title: 'Payments',
    body: 'Payments are processed through Razorpay. FreshCart never stores card details. Payment status is accepted only after server-side signature verification and webhook confirmation.',
  },
  {
    title: 'Refunds and support',
    body: 'Refund and replacement requests for fresh produce must be raised within the support window configured for the live platform. Qualified requests are reviewed by the support team.',
  },
]

export default function TermsConditionsPage() {
  return (
    <>
      <PageHeader
        title="Terms and conditions"
        description="The terms that will govern use of the FreshCart platform."
        breadcrumbs={[{ label: 'Terms and conditions' }]}
      />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl border border-app-border bg-surface p-6 shadow-sm sm:p-8">
          <p className="text-sm leading-7 text-text-secondary">
            These terms describe the intended production behavior of FreshCart.
            The current interface uses a live catalog but does not create real
            orders or collect payments.
          </p>
          <div className="mt-8 space-y-7">
            {sections.map((section, index) => (
              <section key={section.title}>
                <h2 className="font-semibold text-text-primary">
                  {index + 1}. {section.title}
                </h2>
                <p className="mt-2 text-sm leading-7 text-text-secondary">{section.body}</p>
              </section>
            ))}
          </div>
          <p className="mt-8 border-t border-app-border pt-6 text-xs text-text-secondary">
            Last updated: November 2026 · support@freshcart.demo
          </p>
        </div>
      </div>
    </>
  )
}
