import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PeriodSelector } from './PeriodSelector.jsx'

const pad = (n) => (n < 10 ? '0' + n : '' + n)

export function B2BTopbar({ year, yearOptions, onChangeYear, paused, onTogglePause }) {
  const navigate = useNavigate()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const hm = `${pad(now.getHours())}:${pad(now.getMinutes())}`
  const ss = pad(now.getSeconds())

  return (
    <header className="pktb2b-topbar">
      <button className="pktb2b-topbar__home" onClick={() => navigate('/pkt-hub')} title="PKT-HUB">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12L12 3l9 9"/>
          <path d="M5 10v10a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V10"/>
        </svg>
      </button>
      <div className="pktb2b-topbar__divider"></div>
      <div className="pktb2b-topbar__logo">
        <img src="/pekate-logo.png" alt="Pekatê" />
      </div>
      <div className="pktb2b-topbar__divider"></div>
      <div className="pktb2b-topbar__title">
        <span className="pktb2b-topbar__eyebrow">Pekatê Brasil · Comercial</span>
        <span className="pktb2b-topbar__name">Comando <em>B2B</em></span>
      </div>

      <div className="pktb2b-topbar__spacer"></div>

      <div className="pktb2b-topbar__clock">
        <span className="pktb2b-topbar__clock-label">Hora local</span>
        <span className="pktb2b-clock">
          {hm}<span className="pktb2b-clock__seconds">{ss}</span>
        </span>
      </div>

      <PeriodSelector year={year} yearOptions={yearOptions} onChangeYear={onChangeYear} />

      <div className="pktb2b-live-pill">
        <span>Ao vivo</span>
      </div>
      <button className="pkt-pause-btn" onClick={onTogglePause} title={paused ? 'Retomar' : 'Pausar'}>
        {paused ? '▶' : '⏸'}
      </button>
    </header>
  )
}
