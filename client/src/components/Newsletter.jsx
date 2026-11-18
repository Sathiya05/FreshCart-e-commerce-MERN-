import { useState } from 'react'
import { ArrowRight, Mail } from 'lucide-react'
import { useAppDispatch } from '../redux/hooks.js'
import { pushToast } from '../redux/uiSlice.js'

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const dispatch = useAppDispatch()

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!email.trim()) return
    dispatch(
      pushToast({
        title: 'You are on the list',
        message: 'Newsletter signup is a demo action until Phase 4.',
      }),
    )
    setEmail('')
  }

  return (
    <section className="rounded-3xl bg-brand-dark px-6 py-10 text-white sm:px-10 sm:py-12">
      <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-accent">
            FreshCart newsletter
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Fresh deals, straight to your inbox.
          </h2>
          <p className="mt-2 text-sm leading-6 text-green-100">
            Weekly offers, seasonal produce tips and new arrival alerts. No spam.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="w-full lg:max-w-md">
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <div className="flex flex-col gap-2 rounded-2xl bg-white p-2 sm:flex-row">
            <div className="relative flex-1">
              <Mail size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
              <input
                id="newsletter-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="h-11 w-full rounded-xl bg-app-background pl-10 pr-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-primary px-5 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              Subscribe
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
