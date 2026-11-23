import { useEffect, useRef, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import AIChatPanel from './ai/AIChatPanel.jsx'
import WhatsAppIcon from './WhatsAppIcon.jsx'
import { askAssistant, getAiStatus } from '../services/ai.service.js'
import { useAppDispatch, useAppSelector } from '../redux/hooks.js'
import { addToCart, AUTH_REQUIRED, setCart } from '../redux/cartSlice.js'
import { pushToast, selectToasts } from '../redux/uiSlice.js'
import { resolveWhatsAppPhone } from '../utils/whatsapp.js'

const WELCOME_MESSAGES = [
  {
    id: 'welcome',
    role: 'assistant',
    text: "Hi! Welcome to FreshCart. I'm your AI shopping assistant. I can help you find groceries, check prices, discover offers and manage your shopping cart.",
  },
]

const HISTORY_LIMIT = 8
const SESSION_KEY = 'freshcart-ai-chat-v1'
const AFFIRMATIVE_REPLIES = new Set([
  'yes',
  'yes please',
  'yes, please',
  'yes confirm',
  'yes, confirm',
  'y',
  'ok',
  'okay',
  'sure',
  'confirm',
  'confirmed',
  'proceed',
  'go ahead',
  'do it',
  'please do',
  'that works',
  'sounds good',
])

const isAffirmativeConfirmation = (text) =>
  AFFIRMATIVE_REPLIES.has(
    String(text || '')
      .trim()
      .toLowerCase()
      .replace(/[.!]+$/, ''),
  )

const readSession = () => {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY)
    if (!raw) throw new Error('empty')
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed.messages) || !Array.isArray(parsed.history)) {
      throw new Error('invalid')
    }
    return {
      messages: parsed.messages,
      history: parsed.history,
      pendingConfirmation: parsed.pendingConfirmation || null,
    }
  } catch {
    return {
      messages: WELCOME_MESSAGES,
      history: [],
      pendingConfirmation: null,
    }
  }
}

const saveSession = (messages, history, pendingConfirmation) => {
  try {
    window.sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ messages, history, pendingConfirmation }),
    )
  } catch {
    // Session storage is best-effort; the assistant still works without it.
  }
}

export default function FloatingActions() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const toastCount = useAppSelector(selectToasts).length
  const initialSession = useRef(readSession()).current

  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState(initialSession.messages)
  const [history, setHistory] = useState(initialSession.history)
  const [pendingConfirmation, setPendingConfirmation] = useState(
    initialSession.pendingConfirmation,
  )
  const [thinking, setThinking] = useState(false)
  const [aiStatus, setAiStatus] = useState(null)
  const requestId = useRef(0)

  const hasBottomCta = pathname === '/cart' || pathname === '/checkout'

  useEffect(() => {
    let active = true
    getAiStatus().then((status) => {
      if (active) setAiStatus(status)
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    saveSession(messages, history, pendingConfirmation)
  }, [messages, history, pendingConfirmation])

  useEffect(() => {
    if (!chatOpen) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setChatOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [chatOpen])

  const handleSend = async (text, { confirm = false } = {}) => {
    if (thinking) return

    const hasPendingChange = Boolean(pendingConfirmation?.token)
    const shouldConfirm = confirm || (hasPendingChange && isAffirmativeConfirmation(text))
    const confirmation =
      shouldConfirm && hasPendingChange
        ? { ...pendingConfirmation, confirmed: true }
        : undefined

    // An unrelated question must never silently commit a prepared cart change.
    if (hasPendingChange && !shouldConfirm) setPendingConfirmation(null)

    const currentRequest = requestId.current + 1
    requestId.current = currentRequest

    setMessages((current) => [
      ...current,
      { id: `user-${currentRequest}`, role: 'user', text },
    ])
    setThinking(true)

    try {
      const result = await askAssistant({ message: text, history, confirmation })

      if (currentRequest !== requestId.current) return

      if (result.cart) dispatch(setCart(result.cart))
      setPendingConfirmation(result.pendingConfirmation)

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${currentRequest}`,
          role: 'assistant',
          text: result.answer,
          products: result.products,
        },
      ])
      setHistory((current) =>
        [
          ...current,
          { role: 'user', content: text },
          { role: 'assistant', content: result.answer },
        ].slice(-HISTORY_LIMIT),
      )
    } catch (error) {
      if (currentRequest !== requestId.current) return

      setMessages((current) => [
        ...current,
        {
          id: `error-${currentRequest}`,
          role: 'assistant',
          tone: 'warning',
          retryText: text,
          text: error?.message || 'The assistant is unavailable right now. Please try again.',
        },
      ])
    } finally {
      if (currentRequest === requestId.current) setThinking(false)
    }
  }

  const handleClear = () => {
    requestId.current += 1
    setThinking(false)
    setMessages(WELCOME_MESSAGES)
    setHistory([])
    setPendingConfirmation(null)
  }

  const handleConfirmCartChange = () => handleSend('Yes, confirm.', { confirm: true })

  const handleCancelCartChange = () => setPendingConfirmation(null)

  const handleWhatsApp = () => {
    const phone = resolveWhatsAppPhone(import.meta.env.VITE_WHATSAPP_PHONE)

    if (!phone) {
      dispatch(
        pushToast({
          type: 'info',
          title: 'WhatsApp shopping',
          message: 'No WhatsApp business number is configured for FreshCart.',
        }),
      )
      return
    }

    const text = encodeURIComponent(
      'Hi FreshCart! I would like help with products, prices, stock, delivery or payments.',
    )
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank', 'noopener,noreferrer')
  }

  const handleAddProduct = async (product, quantity = 1) => {
    const result = await dispatch(addToCart(product, quantity))
    if (result === AUTH_REQUIRED) {
      navigate('/login', { state: { from: { pathname } } })
    }
  }

  return (
    <div
      style={{ '--dock-lift': `${Math.min(toastCount, 2) * 4.5}rem` }}
      className={`floating-actions fixed right-4 z-[45] flex flex-col items-end gap-3 transition-[bottom] duration-200 sm:right-6 ${
        hasBottomCta ? 'floating-actions--raised' : ''
      }`}
    >
      <AIChatPanel
        open={chatOpen}
        messages={messages}
        thinking={thinking}
        compact={hasBottomCta}
        aiStatus={aiStatus}
        pendingConfirmation={pendingConfirmation}
        onSend={handleSend}
        onRetry={handleSend}
        onConfirm={handleConfirmCartChange}
        onCancel={handleCancelCartChange}
        onClear={handleClear}
        onClose={() => setChatOpen(false)}
        onAddProduct={handleAddProduct}
      />

      <button
        type="button"
        onClick={() => setChatOpen((value) => !value)}
        aria-label={chatOpen ? 'Close AI assistant' : 'Open AI assistant'}
        aria-expanded={chatOpen}
        aria-controls="freshcart-ai-chat"
        title="Ask FreshCart AI"
        className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-brand-primary to-brand-dark text-white shadow-lg ring-2 ring-white transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/30"
      >
        <Sparkles size={21} aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={handleWhatsApp}
        aria-label="Open WhatsApp shopping"
        title="WhatsApp shopping"
        className="grid h-11 w-11 place-items-center rounded-full bg-[#25D366] text-white shadow-lg ring-2 ring-white transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/30"
      >
        <WhatsAppIcon />
      </button>
    </div>
  )
}
