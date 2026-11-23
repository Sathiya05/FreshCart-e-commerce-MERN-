import { useEffect, useRef } from 'react'
import { Bot, RotateCcw, Sparkles, X } from 'lucide-react'
import AIChatComposer from './AIChatComposer.jsx'
import AIChatMessage from './AIChatMessage.jsx'

const SUGGESTED_PROMPTS = [
  'What vegetables are available?',
  'Show fruits under ₹100',
  'What is in my cart?',
  'How much is delivery?',
  'Which payment methods are available?',
]

export default function AIChatPanel({
  open,
  messages,
  thinking,
  compact = false,
  aiStatus,
  onSend,
  onClear,
  onClose,
  onAddProduct,
}) {
  const panelRef = useRef(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const timer = setTimeout(() => {
      panelRef.current?.querySelector('input')?.focus()
    }, 80)
    return () => clearTimeout(timer)
  }, [open])

  useEffect(() => {
    if (!open || !scrollRef.current) return
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [open, messages, thinking])

  return (
    <div
      ref={panelRef}
      id="freshcart-ai-chat"
      role="dialog"
      aria-label="FreshCart AI assistant"
      aria-hidden={!open}
      className={`absolute bottom-full right-0 mb-3 flex w-[calc(100vw-2rem)] max-w-[380px] flex-col overflow-hidden rounded-2xl border border-app-border bg-surface shadow-2xl transition-all duration-200 sm:w-[380px] ${
        compact ? 'max-h-[calc(100dvh-15rem)]' : 'max-h-[calc(100dvh-10rem)]'
      } ${
        open
          ? 'visible translate-y-0 scale-100 opacity-100'
          : 'invisible pointer-events-none translate-y-2 scale-95 opacity-0'
      }`}
    >
      <div className="flex items-center gap-3 bg-gradient-to-r from-brand-primary to-brand-dark px-4 py-3 text-white">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15">
          <Sparkles size={18} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">FreshCart Assistant</p>
          <p className="text-[11px] text-white/80">AI shopping help</p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="grid h-8 w-8 place-items-center rounded-lg text-white/80 transition hover:bg-white/15 hover:text-white"
          aria-label="Clear conversation"
          title="Clear conversation"
        >
          <RotateCcw size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="grid h-8 w-8 place-items-center rounded-lg text-white/80 transition hover:bg-white/15 hover:text-white"
          aria-label="Close assistant"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-app-background px-4 py-4">
        {!aiStatus && (
          <div className="rounded-xl border border-app-border bg-surface p-3 text-xs leading-5 text-text-secondary">
            Checking assistant availability…
          </div>
        )}

        {aiStatus?.error && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
            Couldn’t verify AI availability. The rest of FreshCart is unaffected; please try again
            shortly.
          </div>
        )}

        {aiStatus?.configured === false && !aiStatus?.error && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
            AI is temporarily unavailable. Shopping and checkout still work normally.
          </div>
        )}

        {aiStatus?.configured === true && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-xs leading-5 text-brand-dark">
            Connected to the live FreshCart catalog. Prices and stock come from the store, not from
            memory.
          </div>
        )}

        {messages.map((message) => (
          <AIChatMessage key={message.id} message={message} onAddProduct={onAddProduct} />
        ))}

        {thinking && (
          <div className="flex items-end gap-2" aria-live="polite">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-secondary text-brand-dark">
              <Bot size={14} aria-hidden="true" />
            </span>
            <span className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-app-border bg-surface px-3 py-3 shadow-sm">
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-secondary"
                  style={{ animationDelay: `${dot * 120}ms` }}
                />
              ))}
            </span>
          </div>
        )}
      </div>

      {!compact && (
        <div className="border-t border-app-border bg-surface px-4 py-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-text-secondary">
            Try asking
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => onSend(prompt)}
                className="rounded-full border border-brand-primary/20 bg-brand-secondary px-2.5 py-1 text-[11px] font-medium text-brand-dark transition hover:border-brand-primary/40 hover:bg-brand-primary/10"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      <AIChatComposer onSend={onSend} disabled={thinking} />
    </div>
  )
}
