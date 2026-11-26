import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'

/** Keeps a failed lazy chunk or render error from blanking the whole store. */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('FreshCart render error:', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div
        className="flex min-h-dvh items-center justify-center bg-app-background px-4"
        role="alert"
      >
        <div className="w-full max-w-lg rounded-2xl border border-app-border bg-surface p-6 text-center shadow-sm sm:p-8">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-red-50 text-red-600">
            <AlertTriangle size={26} aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-xl font-bold text-text-primary">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            This page could not be loaded. Your cart and orders are safe — try
            again or return to the storefront.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="h-11 rounded-xl bg-brand-primary px-5 text-sm font-semibold text-white hover:bg-brand-primary/90"
            >
              Reload page
            </button>
            <a
              href="/"
              className="inline-flex h-11 items-center rounded-xl border border-app-border px-5 text-sm font-semibold text-text-primary hover:border-brand-primary"
            >
              Go home
            </a>
          </div>
        </div>
      </div>
    )
  }
}
