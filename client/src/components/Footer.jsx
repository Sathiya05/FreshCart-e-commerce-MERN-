import { BriefcaseBusiness, Camera, Globe2, Mail, MapPin, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import BrandLogo from './BrandLogo.jsx'
import DemoBadge from './DemoBadge.jsx'

const groups = [
  {
    title: 'Shop',
    links: [
      { label: 'All products', to: '/shop' },
      { label: 'Categories', to: '/categories' },
      { label: 'Daily deals', to: '/shop?sort=price-asc' },
      { label: 'Wishlist', to: '/wishlist' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About us', to: '/about' },
      { label: 'Contact us', to: '/contact' },
      { label: 'FAQ', to: '/faq' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy policy', to: '/privacy' },
      { label: 'Terms & conditions', to: '/terms' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-app-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <BrandLogo />
            <p className="mt-4 max-w-sm text-sm leading-6 text-text-secondary">
              FreshCart brings farm-quality groceries to your doorstep with simple
              shopping, transparent pricing and reliable delivery slots.
            </p>
            <div className="mt-5 space-y-2 text-sm text-text-secondary">
              <p className="flex items-center gap-2"><MapPin size={15} aria-hidden="true" /> Bengaluru, Karnataka, India</p>
              <p className="flex items-center gap-2"><Phone size={15} aria-hidden="true" /> +91 18000 12345</p>
              <p className="flex items-center gap-2"><Mail size={15} aria-hidden="true" /> support@freshcart.demo</p>
            </div>
            <div className="mt-5 flex gap-2">
              {[
                { Icon: Globe2, label: 'Website' },
                { Icon: Camera, label: 'Gallery' },
                { Icon: BriefcaseBusiness, label: 'Business' },
              ].map(({ Icon, label }) => (
                <span
                  key={label}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-app-border text-text-secondary"
                  role="img"
                  aria-label={label}
                >
                  <Icon size={16} aria-hidden="true" />
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {groups.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-semibold text-text-primary">{group.title}</h3>
                <ul className="mt-4 space-y-3">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link to={link.to} className="text-sm text-text-secondary hover:text-brand-primary">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-app-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-text-secondary">
            © {new Date().getFullYear()} FreshCart. Phase 2 UI preview.
          </p>
          <DemoBadge />
        </div>
      </div>
    </footer>
  )
}
