import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const DAY_NAMES = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const MONTH_NAMES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

const pad = (n) => (n < 10 ? '0' + n : '' + n)

export function Topbar({ paused, onTogglePause, onOpenRoulette, onOpenReport }) {
  const navigate = useNavigate()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const todayLabel = `${DAY_NAMES[now.getDay()]}, ${now.getDate()} ${MONTH_NAMES[now.getMonth()]}`
  const hm = `${pad(now.getHours())}:${pad(now.getMinutes())}`
  const ss = pad(now.getSeconds())
  const quarter = Math.floor(now.getMonth() / 3) + 1
  const year = now.getFullYear()

  return (
    <header className="pkt-topbar">
      <button className="pkt-topbar__home" onClick={() => navigate('/pkt-hub')} title="PKT-HUB">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12L12 3l9 9"/>
          <path d="M5 10v10a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V10"/>
        </svg>
      </button>
      <div className="pkt-topbar__divider"></div>
      <div className="pkt-topbar__logo">
        <img src="/pekate-logo.png" alt="Pekatê" />
      </div>
      <div className="pkt-topbar__divider"></div>
      <div className="pkt-topbar__title">
        <span className="pkt-topbar__eyebrow">Pekatê Brasil · Comercial</span>
        <span className="pkt-topbar__name">Comando <em>B2C</em></span>
      </div>

      <div className="pkt-topbar__spacer"></div>

      <div className="pkt-topbar__cycle">
        <div className="pkt-meta-block">
          <span className="pkt-meta-block__label">Ciclo</span>
          <span className="pkt-meta-block__value">Q{quarter} · <em>{year}</em></span>
        </div>
        <div className="pkt-meta-block">
          <span className="pkt-meta-block__label">Hoje</span>
          <span className="pkt-meta-block__value">{todayLabel}</span>
        </div>
        <div className="pkt-meta-block pkt-meta-block--left">
          <span className="pkt-meta-block__label">Hora local</span>
          <span className="pkt-clock">
            {hm}<span className="pkt-clock__seconds">{ss}</span>
          </span>
        </div>
      </div>

      <div className="pkt-live-pill">
        <span>Ao vivo</span>
      </div>
      <button className="pkt-pause-btn" onClick={onTogglePause} title={paused ? 'Retomar' : 'Pausar'}>
        {paused ? '▶' : '⏸'}
      </button>
      <button className="pkt-roulette-btn" onClick={onOpenRoulette} title="Roleta de Prêmios">
        🎰
      </button>
      <button className="pkt-report-btn" onClick={onOpenReport} title="Relatório Semanal">
        📊
      </button>
    </header>
  )
}
