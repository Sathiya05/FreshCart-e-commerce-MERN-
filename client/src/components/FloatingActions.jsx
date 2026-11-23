import { useEffect, useRef, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import AIChatPanel from './ai/AIChatPanel.jsx'
import { askAssistant, getAiStatus } from '../services/ai.service.js'
import { useAppDispatch, useAppSelector } from '../redux/hooks.js'
import { pushToast, selectToasts } from '../redux/uiSlice.js'

const WELCOME_MESSAGES = [
  {
    id: 'welcome',
    role: 'assistant',
    text: 'Hi! I’m the FreshCart assistant. I can search live products, prices and stock. What are you looking for?',
  },
]

const HISTORY_LIMIT = 8

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" className="h-6 w-6" aria-hidden="true">
      <path d="M16.004 2.004c-7.728 0-14 6.27-14 13.998 0 2.47.648 4.884 1.878 7.006L2 30l7.164-1.873A13.94 13.94 0 0 0 16 30h.004c7.726 0 14-6.27 14-13.998 0-3.74-1.456-7.253-4.096-9.896a13.91 13.91 0 0 0-9.904-4.102Zm0 25.2h-.002a11.65 11.65 0 0 1-5.936-1.628l-.426-.253-4.25 1.112 1.133-4.14-.277-.427a11.62 11.62 0 0 1-1.788-6.204c0-6.44 5.24-11.68 11.68-11.68 3.12 0 6.052 1.217 8.258 3.426a11.6 11.6 0 0 1 3.418 8.26c0 6.44-5.24 11.634-11.682 11.634Zm6.41-8.74c-.35-.176-2.08-1.026-2.402-1.145-.322-.118-.556-.176-.79.176-.235.353-.906 1.144-1.11 1.379-.205.235-.409.264-.759.088-.35-.176-1.48-.545-2.82-1.74a10.6 10.6 0 0 1-1.95-2.428c-.205-.353-.022-.543.154-.719.158-.158.35-.411.527-.617.175-.206.234-.353.35-.588.117-.235.059-.44-.03-.617-.088-.176-.79-1.905-1.082-2.607-.285-.685-.574-.592-.79-.603l-.674-.013c-.234 0-.615.088-.937.44-.322.353-1.23 1.203-1.23 2.935s1.26 3.405 1.436 3.64c.176.235 2.478 3.78 6.003 5.302.84.363 1.494.58 2.004.744.842.268 1.608.23 2.213.14.675-.1 2.08-.85 2.374-1.67.293-.823.293-1.528.205-1.676-.088-.146-.322-.234-.672-.41Z" />
    </svg>
  )
}

export default function FloatingActions() {
  const dispatch = useAppDispatch()
  const { pathname } = useLocation()
  const toastCount = useAppSelector(selectToasts).length
  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState(WELCOME_MESSAGES)
  const [history, setHistory] = useState([])
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
    if (!chatOpen) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setChatOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [chatOpen])

  const handleSend = async (text) => {
    if (thinking) return

    const currentRequest = requestId.current + 1
    requestId.current = currentRequest

    setMessages((current) => [
      ...current,
      { id: `user-${currentRequest}`, role: 'user', text },
    ])
    setThinking(true)

    try {
      const result = await askAssistant({ message: text, history })

      if (currentRequest !== requestId.current) return

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
  }

  const handleWhatsApp = () => {
    dispatch(
      pushToast({
        type: 'info',
        title: 'WhatsApp shopping',
        message: 'WhatsApp shopping will be available after the Business Cloud API is connected.',
      }),
    )
  }

  return (
    <div
      style={{ '--dock-lift': `${Math.min(toastCount, 3) * 5.5}rem` }}
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
        onSend={handleSend}
        onClear={handleClear}
        onClose={() => setChatOpen(false)}
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
