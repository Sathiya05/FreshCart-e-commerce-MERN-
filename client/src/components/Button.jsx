const variants = {
  primary: 'bg-brand-primary text-white hover:bg-brand-dark shadow-sm',
  secondary: 'bg-brand-secondary text-brand-dark hover:bg-green-100',
  outline: 'border border-app-border bg-surface text-text-primary hover:border-brand-primary hover:text-brand-dark',
  ghost: 'text-text-secondary hover:bg-app-background hover:text-text-primary',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  accent: 'bg-brand-accent text-[#3d2f00] hover:bg-[#f2bc32] shadow-sm',
}

const sizes = {
  sm: 'h-9 px-3 text-sm',
  // Tight padding for side-by-side card actions so labels never overflow.
  compact: 'h-11 px-2 text-[13px] whitespace-nowrap min-[360px]:px-3',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
  icon: 'h-10 w-10',
}

export default function Button({
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) {
  return (
    <Component
      className={`inline-flex min-w-0 max-w-full items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
}
