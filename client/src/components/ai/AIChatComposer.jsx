import { useState } from 'react'
import { Send } from 'lucide-react'

export default function AIChatComposer({ onSend, disabled = false }) {
  const [value, setValue] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    const text = value.trim()
    if (!text || disabled) return
    onSend(text)
    setValue('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-app-border bg-surface px-3 py-3">
      <input
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        maxLength={500}
        aria-label="Ask FreshCart assistant"
        placeholder="Ask about products, prices or your cart…"
        className="h-11 min-w-0 flex-1 rounded-xl border border-app-border bg-app-background px-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
      />
      <button
        type="submit"
        disabled={!value.trim() || disabled}
        aria-label="Send message"
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-primary text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Send size={16} aria-hidden="true" />
      </button>
    </form>
  )
}
