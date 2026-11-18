import { useState } from 'react'
import { Clock3, Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react'
import Button from '../../components/Button.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import { useAppDispatch } from '../../redux/hooks.js'
import { pushToast } from '../../redux/uiSlice.js'
import { submitDemoContactForm } from '../../services/account.service.js'

const details = [
  { icon: Mail, label: 'Email', value: 'support@freshcart.demo' },
  { icon: Phone, label: 'Phone', value: '+91 18000 12345' },
  { icon: MapPin, label: 'Office', value: 'Bengaluru, Karnataka, India' },
  { icon: Clock3, label: 'Hours', value: 'Monday – Saturday, 9 AM – 7 PM' },
]

export default function ContactUsPage() {
  const dispatch = useAppDispatch()
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sending, setSending] = useState(false)

  const update = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSending(true)
    try {
      const result = await submitDemoContactForm()
      dispatch(
        pushToast({
          title: 'Message captured',
          message: `Demo ticket ${result.ticketId}. Email delivery arrives in Phase 4.`,
        }),
      )
      setForm({ name: '', email: '', subject: '', message: '' })
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Contact us"
        description="Have a question about an order or a product? We are here to help."
        breadcrumbs={[{ label: 'Contact us' }]}
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-4">
            {details.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3 rounded-2xl border border-app-border bg-surface p-5 shadow-sm">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-secondary text-brand-dark">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{label}</p>
                  <p className="mt-1 text-sm text-text-secondary">{value}</p>
                </div>
              </div>
            ))}
            <div className="rounded-2xl border border-brand-primary bg-brand-secondary/50 p-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-brand-dark">
                <MessageCircle size={17} aria-hidden="true" />
                Demo support
              </p>
              <p className="mt-2 text-sm leading-6 text-brand-dark">
                The form is a UI preview. Nodemailer support is planned for Phase 4.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="rounded-2xl border border-app-border bg-surface p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-semibold text-text-primary">Send us a message</h2>
            <p className="mt-1 text-sm text-text-secondary">Fill in the details below and we will get back to you.</p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-name" className="mb-2 block text-sm font-medium">Your name</label>
                <input id="contact-name" required value={form.name} onChange={update('name')} className="h-11 w-full rounded-xl border border-app-border px-3 text-sm outline-none focus:border-brand-primary" />
              </div>
              <div>
                <label htmlFor="contact-email" className="mb-2 block text-sm font-medium">Email address</label>
                <input id="contact-email" type="email" required value={form.email} onChange={update('email')} className="h-11 w-full rounded-xl border border-app-border px-3 text-sm outline-none focus:border-brand-primary" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="contact-subject" className="mb-2 block text-sm font-medium">Subject</label>
                <input id="contact-subject" required value={form.subject} onChange={update('subject')} className="h-11 w-full rounded-xl border border-app-border px-3 text-sm outline-none focus:border-brand-primary" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="contact-message" className="mb-2 block text-sm font-medium">Message</label>
                <textarea id="contact-message" required rows="5" value={form.message} onChange={update('message')} className="w-full rounded-xl border border-app-border px-3 py-3 text-sm outline-none focus:border-brand-primary" />
              </div>
            </div>
            <Button type="submit" className="mt-6" disabled={sending}>
              <Send size={16} aria-hidden="true" />
              {sending ? 'Sending…' : 'Send message'}
            </Button>
          </form>
        </div>
      </div>
    </>
  )
}
