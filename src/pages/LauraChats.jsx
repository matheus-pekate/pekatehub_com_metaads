import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './laura-chats.css'

function parseMessage(raw) {
  const match = raw.match(/^(AI|USER)_(\d{4}-\d{2}-\d{2}T[\d:.+-]+):\s?(.*)$/s)
  if (!match) return { role: 'unknown', time: '', text: raw }
  return {
    role: match[1] === 'AI' ? 'ai' : 'user',
    time: match[2],
    text: match[3].trim(),
  }
}

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function formatPhone(key) {
  const num = key.replace('chat-history_', '')
  return num.replace(/^(\d{2})(\d{2})(\d{5})(\d{4})$/, '+$1 ($2) $3-$4') || num
}

export function LauraChats() {
  const navigate = useNavigate()
  const [chats, setChats] = useState({})
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    fetch('http://localhost:3001/api/chats')
      .then((r) => r.json())
      .then((data) => {
        setChats(data.chats || {})
        const first = Object.keys(data.chats || {})[0]
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

  const keys = Object.keys(chats)
  const messages = selected ? (chats[selected] || []).map(parseMessage) : []

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
            const msgs = chats[key].map(parseMessage)
            const last = msgs[msgs.length - 1]
            return (
              <button
                key={key}
                className={`lc-chat-item ${selected === key ? 'lc-chat-item--active' : ''}`}
                onClick={() => setSelected(key)}
              >
                <div className="lc-chat-item__avatar">{formatPhone(key).slice(-2)}</div>
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
              <div className="lc-chat-header__avatar">{formatPhone(selected).slice(-2)}</div>
              <div>
                <span className="lc-chat-header__phone">{formatPhone(selected)}</span>
                <span className="lc-chat-header__count">{messages.length} mensagens</span>
              </div>
            </div>

            <div className="lc-messages">
              {messages.map((m, i) => (
                <div key={i} className={`lc-bubble lc-bubble--${m.role}`}>
                  <p className="lc-bubble__text">{m.text}</p>
                  <span className="lc-bubble__time">{formatTime(m.time)}</span>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </>
        )}
      </main>
    </div>
  )
}
