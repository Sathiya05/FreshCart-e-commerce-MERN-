import { Bot, RotateCw, User } from 'lucide-react'
import AIProductCard from './AIProductCard.jsx'

export default function AIChatMessage({ message, onAddProduct, onRetry }) {
  const isUser = message.role === 'user'
  const isWarning = message.tone === 'warning'
  const products = Array.isArray(message.products) ? message.products : []

  return (
    <div className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-secondary text-brand-dark">
          <Bot size={14} aria-hidden="true" />
        </span>
      )}

      <div
        className={`rounded-2xl px-3.5 py-2.5 text-sm leading-5 shadow-sm ${
          isUser
            ? 'max-w-[85%] rounded-br-sm bg-brand-primary text-white'
            : products.length
              ? 'w-full rounded-bl-sm border border-app-border bg-surface text-text-primary'
              : `max-w-[85%] rounded-bl-sm ${
                  isWarning
                    ? 'border border-amber-200 bg-amber-50 text-amber-900'
                    : 'border border-app-border bg-surface text-text-primary'
                }`
        }`}
      >
        <p className="whitespace-pre-wrap">{message.text}</p>

        {isWarning && message.retryText && onRetry && (
          <button
            type="button"
            onClick={() => onRetry(message.retryText)}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-amber-300 px-2.5 py-1 text-xs font-semibold text-amber-900 transition hover:bg-amber-100"
          >
            <RotateCw size={12} aria-hidden="true" />
            Retry
          </button>
        )}

        {products.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {products.map((product) => (
              <AIProductCard
                key={product.id}
                product={product}
                canAdd={Boolean(onAddProduct)}
                onAdd={onAddProduct}
              />
            ))}
          </div>
        )}
      </div>

      {isUser && (
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-app-border text-text-secondary">
          <User size={14} aria-hidden="true" />
        </span>
      )}
    </div>
  )
}
