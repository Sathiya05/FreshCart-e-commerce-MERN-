import PageHeader from '../../components/PageHeader.jsx'

const sections = [
  {
    title: 'Information we collect',
    body: 'When the full platform is enabled, FreshCart will collect account details such as your name, email, phone number, delivery addresses, order history and support messages. Payment card details are handled by Razorpay and are never stored on FreshCart servers.',
  },
  {
    title: 'How we use information',
    body: 'We use your information to create and manage your account, fulfill orders, provide delivery updates, prevent fraud, improve the storefront and respond to support requests.',
  },
  {
    title: 'Cookies and security',
    body: 'Authentication cookies may be used to keep you signed in securely. The production application uses HTTP-only cookies, Helmet security headers, rate limiting and server-side authorization checks.',
  },
  {
    title: 'Data sharing',
    body: 'We do not sell personal information. Data is shared only with service providers required to operate the platform, such as payment processing, email delivery and cloud infrastructure providers.',
  },
  {
    title: 'Your choices',
    body: 'You can update your profile and addresses from your account area. Account deletion and data export workflows will be added with the authenticated APIs.',
  },
]

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageHeader
        title="Privacy policy"
        description="How FreshCart handles information when the full platform is live."
        breadcrumbs={[{ label: 'Privacy policy' }]}
      />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl border border-app-border bg-surface p-6 shadow-sm sm:p-8">
          <p className="text-sm leading-7 text-text-secondary">
            This page describes the intended privacy practices for FreshCart. Account
            details are sent to the live API, but checkout and order flows are still
            previews and do not create real orders.
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
