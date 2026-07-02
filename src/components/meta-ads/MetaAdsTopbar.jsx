import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const pad = (n) => (n < 10 ? '0' + n : '' + n)

function minutesAgo(date) {
  if (!date) return null
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000))
}

export function MetaAdsTopbar({ lastUpdated, error, onRefresh }) {
  const navigate = useNavigate()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const hm = `${pad(now.getHours())}:${pad(now.getMinutes())}`
  const ss = pad(now.getSeconds())
  const mins = minutesAgo(lastUpdated)
  const updatedLabel = mins == null ? 'carregando…' : mins === 0 ? 'agora mesmo' : `há ${mins}min`

  return (
    <header className="pkt-meta-topbar">
      <button className="pkt-meta-topbar__home" onClick={() => navigate('/pkt-hub')} title="PKT-HUB">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12L12 3l9 9" />
          <path d="M5 10v10a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V10" />
        </svg>
      </button>
      <div className="pkt-meta-topbar__divider" />
      <div className="pkt-meta-topbar__title">
        <span className="pkt-meta-topbar__eyebrow">Pekatê Brasil · Marketing</span>
        <span className="pkt-meta-topbar__name">Comando <em>Meta Ads</em></span>
      </div>

      <div className="pkt-meta-topbar__spacer" />

      <div className={`pkt-meta-status ${error ? 'pkt-meta-status--error' : ''}`}>
        <span className="pkt-meta-status__label">Atualizado</span>
        <span className="pkt-meta-status__value">{updatedLabel}</span>
        {error && <span className="pkt-meta-status__error" title={error}>⚠ dados desatualizados</span>}
      </div>

      <span className="pkt-meta-clock">
        {hm}<span className="pkt-meta-clock__seconds">{ss}</span>
      </span>

      <button className="pkt-meta-refresh-btn" onClick={onRefresh} title="Atualizar agora">
        ↻
      </button>
    </header>
  )
}
