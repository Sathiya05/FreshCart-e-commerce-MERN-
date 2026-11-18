import { Compass, Home } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../../components/Button.jsx'

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-20 text-center sm:px-6">
      <span className="grid h-20 w-20 place-items-center rounded-3xl bg-brand-secondary text-brand-primary">
        <Compass size={38} aria-hidden="true" />
      </span>
      <p className="mt-8 text-sm font-bold uppercase tracking-[0.2em] text-brand-primary">
        404 — Page not found
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight text-text-primary">
        Looks like this aisle is empty.
      </h1>
      <p className="mt-4 max-w-md text-sm leading-7 text-text-secondary">
        The page you are looking for may have moved or does not exist. Let us get
        you back to something fresh.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button as={Link} to="/">
          <Home size={16} aria-hidden="true" />
          Back to home
        </Button>
        <Button as={Link} to="/shop" variant="outline">
          Browse products
        </Button>
      </div>
    </div>
  )
}
