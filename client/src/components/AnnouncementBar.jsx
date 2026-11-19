import { CheckCircle2, Clock3, RefreshCw, Truck } from 'lucide-react'

const items = [
  { icon: Truck, text: 'Free delivery on orders above ₹499' },
  { icon: Clock3, text: 'Same-day slots in selected cities' },
  { icon: RefreshCw, text: 'Easy returns on fresh produce' },
]

export default function AnnouncementBar() {
  return (
    <div className="bg-brand-dark text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-3 py-2 text-xs sm:justify-between sm:gap-6 sm:px-6">
        {items.map(({ icon: Icon, text }, index) => (
          <span key={text} className={`items-center gap-1.5 ${index === 0 ? 'flex min-w-0' : 'hidden md:flex'}`}>
            <Icon size={13} className="shrink-0" aria-hidden="true" />
            <span className="truncate">{text}</span>
          </span>
        ))}
        <span
          className="flex shrink-0 items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 font-semibold text-white"
          title="Build marker: cart and Buy Now fixes are loaded"
        >
          <CheckCircle2 size={12} aria-hidden="true" />
          Cart ready · v2
        </span>
      </div>
    </div>
  )
}
