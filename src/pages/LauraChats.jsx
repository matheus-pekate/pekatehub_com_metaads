import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './laura-chats.css'

function parseMessage(raw) {
  const match = raw.match(/^(AI|USER)(?:_[A-Za-z]+)?_(\d{4}-\d{2}-\d{2}T[\d:.+-]+):\s?(.*)$/s)
  if (!match) return { role: 'unknown', time: '', text: raw }
  return {
    role: match[1] === 'AI' ? 'ai' : 'user',
    time: match[2],
    text: match[3].trim(),
  }
}

function formatTime(iso) {
  try {
    const date = new Date(iso)
    const day = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    const hour = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    return `${day} ${hour}`
  } catch {
    return ''
  }
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function formatDayLabel(iso) {
  const date = new Date(iso)
  if (isNaN(date.getTime())) return ''
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (isSameDay(date, now)) return 'Hoje'
  if (isSameDay(date, yesterday)) return 'Ontem'
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function sortByTime(messages) {
  return [...messages].sort((a, b) => {
    const ta = new Date(a.time).getTime()
    const tb = new Date(b.time).getTime()
    return (isNaN(ta) ? 0 : ta) - (isNaN(tb) ? 0 : tb)
  })
}

function getLastMessageTime(rawMessages) {
  const sorted = sortByTime((rawMessages || []).map(parseMessage))
  const last = sorted[sorted.length - 1]
  const t = last ? new Date(last.time).getTime() : 0
  return isNaN(t) ? 0 : t
}

function sortKeysByRecency(chats) {
  return Object.keys(chats).sort((a, b) => getLastMessageTime(chats[b]) - getLastMessageTime(chats[a]))
}

function withDaySeparators(messages) {
  const out = []
  let lastDay = null
  for (const m of messages) {
    const date = new Date(m.time)
    if (!isNaN(date.getTime())) {
      const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
      if (dayKey !== lastDay) {
        out.push({ separator: true, label: formatDayLabel(m.time) })
        lastDay = dayKey
      }
    }
    out.push(m)
  }
  return out
}

function formatShortDate(iso) {
  try {
    const date = new Date(iso)
    if (isNaN(date.getTime())) return '—'
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  } catch {
    return '—'
  }
}

function formatPhone(key) {
  const num = key.replace('chat-history_', '')
  return num.replace(/^(\d{2})(\d{2})(\d{5})(\d{4})$/, '+$1 ($2) $3-$4') || num
}

export function LauraChats() {
  const navigate = useNavigate()
  const [chats, setChats] = useState({})
  const [photos, setPhotos] = useState({})
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    fetch('/api/chats')
      .then((r) => r.json())
      .then((data) => {
        setChats(data.chats || {})
        setPhotos(data.photos || {})
        const first = sortKeysByRecency(data.chats || {})[0]
        if (first) setSelected(first)
        setLoading(false)
      })
      .catch(() => {
        setError('Não foi possível conectar à API.')
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selected])

  const keys = sortKeysByRecency(chats)
  const sortedMessages = selected ? sortByTime((chats[selected] || []).map(parseMessage)) : []
  const messages = withDaySeparators(sortedMessages)

  return (
    <div className="lc-layout">
      {/* Sidebar */}
      <aside className="lc-sidebar">
        <div className="lc-sidebar__header">
          <button className="lc-back" onClick={() => navigate('/pkt-hub')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Voltar
          </button>
          <div className="lc-agent-info">
            <img src="/Laura-agent.png" alt="Laura" className="lc-agent-photo" />
            <div>
              <span className="lc-agent-name">Laura Vieira</span>
              <span className="lc-agent-role">Pré-qualificação B2C</span>
            </div>
          </div>
        </div>

        <div className="lc-sidebar__list">
          {loading && <p className="lc-empty">Carregando...</p>}
          {error && <p className="lc-empty lc-empty--error">{error}</p>}
          {!loading && keys.length === 0 && <p className="lc-empty">Nenhuma conversa encontrada.</p>}
          {keys.map((key) => {
            const msgs = sortByTime(chats[key].map(parseMessage))
            const first = msgs[0]
            const last = msgs[msgs.length - 1]
            return (
              <button
                key={key}
                className={`lc-chat-item ${selected === key ? 'lc-chat-item--active' : ''}`}
                onClick={() => setSelected(key)}
              >
                <div className="lc-chat-item__dates">
                  <span className="lc-chat-item__date-row">
                    <span className="lc-chat-item__date-label">Início</span>
                    <span className="lc-chat-item__date-value">{formatShortDate(first?.time)}</span>
                  </span>
                  <span className="lc-chat-item__date-row">
                    <span className="lc-chat-item__date-label">Última</span>
                    <span className="lc-chat-item__date-value">{formatShortDate(last?.time)}</span>
                  </span>
                </div>
                <div className="lc-chat-item__info">
                  <span className="lc-chat-item__phone">{formatPhone(key)}</span>
                  <span className="lc-chat-item__preview">{last?.text?.slice(0, 45)}…</span>
                </div>
                <span className="lc-chat-item__count">{msgs.length}</span>
              </button>
            )
          })}
        </div>
      </aside>

      {/* Chat window */}
      <main className="lc-main">
        {!selected ? (
          <div className="lc-empty-state">Selecione uma conversa</div>
        ) : (
          <>
            <div className="lc-chat-header">
              {photos[selected.replace('chat-history_', '')] ? (
                <img
                  className="lc-chat-header__avatar-photo"
                  src={photos[selected.replace('chat-history_', '')]}
                  alt=""
                  onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'grid' }}
                />
              ) : null}
              <div
                className="lc-chat-header__avatar"
                style={photos[selected.replace('chat-history_', '')] ? { display: 'none' } : undefined}
              >
                {formatPhone(selected).slice(-2)}
              </div>
              <div>
                <span className="lc-chat-header__phone">{formatPhone(selected)}</span>
                <span className="lc-chat-header__count">{sortedMessages.length} mensagens</span>
              </div>
            </div>

            <div className="lc-messages">
              {messages.map((m, i) =>
                m.separator ? (
                  <div key={i} className="lc-day-separator"><span>{m.label}</span></div>
                ) : (
                  <div key={i} className={`lc-bubble lc-bubble--${m.role}`}>
                    <p className="lc-bubble__text">{m.text}</p>
                    <span className="lc-bubble__time">{formatTime(m.time)}</span>
                  </div>
                )
              )}
              <div ref={bottomRef} />
            </div>
          </>
        )}
      </main>
    </div>
  )
}
