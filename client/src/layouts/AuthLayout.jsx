import { CheckCircle2, Leaf, PackageCheck, ShieldCheck, Truck } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo.jsx'
import ToastHost from '../components/ToastHost.jsx'

const highlights = [
  { icon: Truck, text: 'Reliable delivery slots' },
  { icon: PackageCheck, text: 'Freshness checked at packing' },
  { icon: ShieldCheck, text: 'Secure checkout experience' },
]

export default function AuthLayout() {
  return (
    <div className="min-h-dvh bg-app-background lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <div className="relative hidden overflow-hidden bg-brand-dark p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-primary/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-brand-accent/10 blur-3xl" />
        <div className="relative z-10">
          <BrandLogo light />
        </div>
        <div className="relative z-10 max-w-lg">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-accent">
            Welcome to FreshCart
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight">
            Better groceries, better everyday meals.
          </h1>
          <p className="mt-5 text-base leading-7 text-green-100">
            Shop fresh produce, pantry staples and daily essentials from one calm,
            easy-to-use store.
          </p>
          <ul className="mt-8 space-y-3">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-green-50">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10">
                  <Icon size={16} aria-hidden="true" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative z-10 flex items-center gap-2 text-xs text-green-200">
          <CheckCircle2 size={15} aria-hidden="true" />
          Secure JWT sessions are active — password recovery arrives later
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 lg:justify-end">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-dark lg:hidden">
            <Leaf size={18} aria-hidden="true" />
            FreshCart
          </Link>
          <Link to="/" className="text-sm font-medium text-text-secondary hover:text-brand-primary">
            Back to storefront
          </Link>
        </div>
        <div className="flex flex-1 items-start justify-center px-4 pb-32 pt-4 sm:items-center sm:px-6 sm:pb-16 sm:pt-8">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>
      </div>
      <ToastHost className="inset-x-3 bottom-24 sm:inset-x-auto sm:bottom-6 sm:right-6" />
    </div>
  )
}
