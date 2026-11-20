import { useEffect, useId, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import {
  ChatError,
  createSessionId,
  ERROR_TEXTS,
  MAX_MESSAGE_LENGTH,
  resolveChatUrl,
  sendChatMessage,
  WELCOME_TEXT,
} from '../chat/chatClient.js'

// Adres derleme sırasında okunur; gizli değildir (bkz. chat/chatClient.js).
const CHAT_URL = resolveChatUrl(import.meta.env.VITE_N8N_CHAT_URL)

// Sağ altta sabit "Asistan" düğmesi ve açılan sohbet penceresi.
// Pencere kapatılınca bileşen yerinde kalır; sohbet geçmişi ve oturum kimliği sayfa açık olduğu sürece korunur.
export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([{ id: 0, role: 'bot', text: WELCOME_TEXT }])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(CHAT_URL ? '' : ERROR_TEXTS.config)
  const sessionId = useRef(null)
  const nextId = useRef(1)
  const logRef = useRef(null)
  const inputRef = useRef(null)
  const toggleRef = useRef(null)
  const titleId = useId()
  const panelId = useId()

  useEffect(() => {
    if (!CHAT_URL) console.warn('[AtölyeKart Asistan] VITE_N8N_CHAT_URL tanımlı değil; sohbet devre dışı.')
  }, [])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    const log = logRef.current
    if (log) log.scrollTop = log.scrollHeight
  }, [messages, sending, error, open])

  function close() {
    setOpen(false)
    toggleRef.current?.focus()
  }

  async function onSubmit(event) {
    event.preventDefault()
    const text = draft.trim()
    if (!text || sending || !CHAT_URL) return

    sessionId.current ??= createSessionId()
    const id = nextId.current++
    setMessages((list) => [...list, { id, role: 'user', text }])
    setDraft('')
    setError('')
    setSending(true)
    try {
      const reply = await sendChatMessage({ url: CHAT_URL, sessionId: sessionId.current, message: text })
      setMessages((list) => [...list, { id: nextId.current++, role: 'bot', text: reply }])
    } catch (err) {
      if (err instanceof ChatError) console.warn('[AtölyeKart Asistan]', err.kind, err.detail)
      else console.error('[AtölyeKart Asistan]', err)
      // Gönderilemeyen mesaj geçmişten çıkar ve kutuya geri döner; ziyaretçi aynı metni yeniden gönderebilir.
      setMessages((list) => list.filter((message) => message.id !== id))
      setDraft((current) => current || text)
      setError(err instanceof ChatError ? err.message : ERROR_TEXTS.server)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="lp-chat">
      <section
        id={panelId}
        className="lp-chat-panel"
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        hidden={!open}
        onKeyDown={(event) => {
          if (event.key === 'Escape') close()
        }}
      >
        <header className="lp-chat-header">
          <span className="lp-chat-mark" aria-hidden="true">
            <Icon name="chat" size={18} />
          </span>
          <h2 id={titleId} className="lp-chat-title">
            AtölyeKart Asistan
          </h2>
          <button type="button" className="lp-icon-button lp-chat-close" onClick={close} aria-label="Sohbeti kapat">
            <Icon name="close" />
          </button>
        </header>

        <ol className="lp-chat-log" ref={logRef} role="log" aria-live="polite" aria-relevant="additions" aria-busy={sending}>
          {messages.map((message) => (
            <li key={message.id} className={`lp-chat-message lp-chat-message-${message.role}`}>
              <span className="lp-visually-hidden">{message.role === 'user' ? 'Siz: ' : 'Asistan: '}</span>
              {message.text}
            </li>
          ))}
          {sending && (
            <li className="lp-chat-message lp-chat-message-bot lp-chat-typing">
              <span className="lp-chat-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <span className="lp-visually-hidden">Asistan yanıt yazıyor…</span>
            </li>
          )}
        </ol>

        {error && (
          <p className="lp-chat-error" role="alert">
            {error}
          </p>
        )}

        <form className="lp-chat-form" onSubmit={onSubmit}>
          <label className="lp-visually-hidden" htmlFor={`${panelId}-input`}>
            Mesajınız
          </label>
          <input
            id={`${panelId}-input`}
            ref={inputRef}
            type="text"
            autoComplete="off"
            enterKeyHint="send"
            maxLength={MAX_MESSAGE_LENGTH}
            placeholder={CHAT_URL ? 'Mesajınızı yazın…' : 'Asistan kullanılamıyor'}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={!CHAT_URL}
          />
          <button
            type="submit"
            className="lp-chat-send"
            disabled={!CHAT_URL || sending || !draft.trim()}
            aria-label={sending ? 'Gönderiliyor' : 'Gönder'}
          >
            <Icon name="send" size={18} />
          </button>
        </form>
      </section>

      <button
        ref={toggleRef}
        type="button"
        className="lp-chat-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => (open ? close() : setOpen(true))}
      >
        <Icon name={open ? 'close' : 'chat'} size={20} />
        <span>{open ? 'Kapat' : 'Asistan'}</span>
      </button>
    </div>
  )
}
