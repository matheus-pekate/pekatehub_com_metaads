import { useNavigate } from 'react-router-dom'
import { PROGRAMS, B2C_YEARS } from '../../config/pipedrive.js'

export function YearPicker({ onSelect }) {
  const navigate = useNavigate()

  return (
    <div className="pkt-year">
      <button className="pkt-topbar__home pkt-year__home" onClick={() => navigate('/pkt-hub')} title="PKT-HUB">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12L12 3l9 9"/>
          <path d="M5 10v10a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V10"/>
        </svg>
      </button>

      <header className="pkt-year__head">
        <img src="/pekate-logo.png" alt="Pekatê" className="pkt-year__logo" />
        <span className="pkt-topbar__eyebrow">Pekatê Brasil · Comercial</span>
        <h1 className="pkt-year__title">Comando <em>B2C</em></h1>
        <p className="pkt-year__sub">Qual ano você quer ver?</p>
      </header>

      <div className="pkt-year__grid">
        {B2C_YEARS.map(({ year, label }) => {
          const programs = PROGRAMS.filter((p) => p.year === year)
          return (
            <button key={year} className="pkt-year__card" onClick={() => onSelect(year)}>
              <span className="pkt-year__label">{label}</span>
              <span className="pkt-year__num">{year}</span>
              <span className="pkt-year__programs">
                {programs.map((p) => (
                  <span key={p.id} className="pkt-year__chip" style={{ '--chip': p.accentColor }}>{p.shortName}</span>
                ))}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
