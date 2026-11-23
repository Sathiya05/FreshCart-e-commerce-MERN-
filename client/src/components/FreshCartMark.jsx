/**
 * The single FreshCart brand mark. Its paths match public/favicon.svg exactly so
 * the favicon, navbar, footer, admin sidebar and auth pages all show the same
 * green cart with the fresh leaf handle.
 */
export default function FreshCartMark({ className = '' }) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="FreshCart"
      className={className}
      focusable="false"
    >
      <rect width="64" height="64" rx="16" fill="#16834A" />
      <path
        d="M20 24h24l-2.4 24a4 4 0 0 1-4 3.6H26.4a4 4 0 0 1-4-3.6L20 24Z"
        fill="#F8FAF7"
      />
      <path
        d="M25 24a7 7 0 0 1 14 0"
        fill="none"
        stroke="#F9C74F"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M39 17c4-5 9-5 11-4-1 5-5 9-10 9"
        fill="#E8F5E9"
        stroke="#E8F5E9"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}
