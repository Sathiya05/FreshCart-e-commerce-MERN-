import { Clock3, RefreshCw, Truck } from 'lucide-react'

const items = [
  { icon: Truck, text: 'Free delivery on orders above ₹499' },
  { icon: Clock3, text: 'Same-day slots in selected cities' },
  { icon: RefreshCw, text: 'Easy returns on fresh produce' },
]

export default function AnnouncementBar() {
  return (
    <div className="bg-brand-dark text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-6 px-4 py-2 text-xs sm:justify-between sm:px-6">
        {items.map(({ icon: Icon, text }, index) => (
          <span key={text} className={`items-center gap-1.5 ${index === 0 ? 'flex' : 'hidden md:flex'}`}>
            <Icon size={13} aria-hidden="true" />
            {text}
          </span>
        ))}
      </div>
    </div>
  )
}
