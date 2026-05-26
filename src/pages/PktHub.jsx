import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import './pkt-hub.css'

const SIDEBAR_ITEMS = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'comercial', label: 'Comercial', icon: 'chart' },
  { id: 'marketing', label: 'Marketing', icon: 'megaphone' },
  { id: 'operacao', label: 'Operação', icon: 'gear' },
]

const TABS = ['Home', 'Comercial', 'Marketing', 'Operação']

function NavIcon({ type }) {
  const icons = {
    home: <path d="M3 12L12 3l9 9M5 10v10a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V10"/>,
    chart: <><path d="M18 20V10M12 20V4M6 20v-6"/></>,
    megaphone: <><path d="M3 11l18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 01-5.8-1.6"/></>,
    gear: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1.08-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1.08 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001.08 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1.08z"/></>,
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icons[type]}
    </svg>
  )
}

export function PktHub() {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState('Home')

  return (
    <div className="hub-layout">
      {/* ── Sidebar ── */}
      <aside className="hub-sidebar">
        <div className="hub-sidebar__top">
          <div className="hub-sidebar__brand">
            <img src="/pekate-logo.png" alt="Pekatê" className="hub-sidebar__logo" />
            <div>
              <span className="hub-sidebar__brand-name">PKT-HUB</span>
              <span className="hub-sidebar__brand-sub">Pekatê Brasil</span>
            </div>
          </div>

          <nav className="hub-sidebar__nav">
            {SIDEBAR_ITEMS.map((item) => (
              <button
                key={item.id}
                className={`hub-nav-item ${activeTab === item.label ? 'hub-nav-item--active' : ''}`}
                onClick={() => setActiveTab(item.label)}
              >
                <NavIcon type={item.icon} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="hub-sidebar__bottom">
          <div className="hub-sidebar__user">
            <div className="hub-sidebar__avatar">PB</div>
            <div>
              <span className="hub-sidebar__user-name">Pekatê Brasil</span>
              <span className="hub-sidebar__user-role">Administrador</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Right column (strip + content) ── */}
      <div className="hub-right">
        <div className="hub-strip">
          <div className="hub-strip__left">
            <span className="hub-strip__page">PKT-HUB</span>
          </div>
          <div className="hub-strip__right">
            <span className="hub-strip__status">Operacional</span>
          </div>
        </div>

        <nav className="hub-tabs">
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`hub-tabs__item ${activeTab === tab ? 'hub-tabs__item--active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>

        <main className="hub-main">
        <div className="hub-banner">
          <div className="hub-banner__content">
            <span className="hub-banner__badge">Central</span>
            <h2 className="hub-banner__title">Pekatê Brasil · PKT-HUB</h2>
            <p className="hub-banner__text">Acompanhe em tempo real os indicadores comerciais, de marketing e operacionais de toda a operação.</p>
          </div>
          <div className="hub-banner__art">
            <img src="/seta-pekate.png" alt="" className="hub-banner__seta" />
          </div>
        </div>

        {activeTab === 'Home' && (
          <section className="hub-main__section">
            <h2 className="hub-main__section-title">Comercial</h2>
            <div className="hub-main__grid">
              <button className="hub-card" onClick={() => navigate('/pekate-dash')}>
                <span className="hub-card__tag">B2C</span>
                <div className="hub-card__icon hub-card__icon--b2c">📊</div>
                <h3 className="hub-card__title">Comando B2C</h3>
                <p className="hub-card__desc">Funil, metas, vendedores e alertas dos programas B2C em tempo real.</p>
                <span className="hub-card__status hub-card__status--live">Ao vivo</span>
              </button>

              <button className="hub-card" onClick={() => navigate('/seller-analysis')}>
                <span className="hub-card__tag">B2C</span>
                <div className="hub-card__icon hub-card__icon--b2c">👤</div>
                <h3 className="hub-card__title">Análise dos Vendedores</h3>
                <p className="hub-card__desc">Performance individual, atividades e metas dos vendedores.</p>
                <span className="hub-card__status hub-card__status--live">Ao vivo</span>
              </button>

              <div className="hub-card hub-card--disabled">
                <span className="hub-card__tag hub-card__tag--b2b">B2B</span>
                <div className="hub-card__icon">🏢</div>
                <h3 className="hub-card__title">Comando B2B</h3>
                <p className="hub-card__desc">Contas corporativas e pipeline enterprise.</p>
                <span className="hub-card__status">Em breve</span>
              </div>

              <div className="hub-card hub-card--disabled">
                <span className="hub-card__tag hub-card__tag--b2b">B2B</span>
                <div className="hub-card__icon">👤</div>
                <h3 className="hub-card__title">Análise dos Vendedores</h3>
                <p className="hub-card__desc">Performance individual, atividades e metas dos vendedores B2B.</p>
                <span className="hub-card__status">Em breve</span>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'Comercial' && (
          <>
            <section className="hub-main__section">
              <h2 className="hub-main__section-title">B2C</h2>
              <div className="hub-main__grid">
                <button className="hub-card" onClick={() => navigate('/pekate-dash')}>
                  <span className="hub-card__tag">B2C</span>
                  <div className="hub-card__icon hub-card__icon--b2c">📊</div>
                  <h3 className="hub-card__title">Comando B2C</h3>
                  <p className="hub-card__desc">Funil, metas, vendedores e alertas dos programas B2C em tempo real.</p>
                  <span className="hub-card__status hub-card__status--live">Ao vivo</span>
                </button>

                <button className="hub-card" onClick={() => navigate('/seller-analysis')}>
                  <span className="hub-card__tag">B2C</span>
                  <div className="hub-card__icon hub-card__icon--b2c">👤</div>
                  <h3 className="hub-card__title">Análise dos Vendedores</h3>
                  <p className="hub-card__desc">Performance individual, atividades e metas dos vendedores B2C.</p>
                  <span className="hub-card__status hub-card__status--live">Ao vivo</span>
                </button>
              </div>
            </section>

            <section className="hub-main__section">
              <h2 className="hub-main__section-title">B2B</h2>
              <div className="hub-main__grid">
                <div className="hub-card hub-card--disabled">
                  <span className="hub-card__tag hub-card__tag--b2b">B2B</span>
                  <div className="hub-card__icon">🏢</div>
                  <h3 className="hub-card__title">Comando B2B</h3>
                  <p className="hub-card__desc">Contas corporativas e pipeline enterprise.</p>
                  <span className="hub-card__status">Em breve</span>
                </div>

                <div className="hub-card hub-card--disabled">
                  <span className="hub-card__tag hub-card__tag--b2b">B2B</span>
                  <div className="hub-card__icon">👤</div>
                  <h3 className="hub-card__title">Análise dos Vendedores</h3>
                  <p className="hub-card__desc">Performance individual, atividades e metas dos vendedores B2B.</p>
                  <span className="hub-card__status">Em breve</span>
                </div>
              </div>
            </section>
          </>
        )}

        {(activeTab === 'Home' || activeTab === 'Marketing') && (
          <section className="hub-main__section">
            <h2 className="hub-main__section-title">Marketing</h2>
            <div className="hub-main__grid">
              <div className="hub-card hub-card--disabled">
                <div className="hub-card__icon">📣</div>
                <h3 className="hub-card__title">Comando Marketing</h3>
                <p className="hub-card__desc">Análise META ADS.</p>
                <span className="hub-card__status">Em breve</span>
              </div>
            </div>
          </section>
        )}

        {(activeTab === 'Home' || activeTab === 'Operação') && (
          <section className="hub-main__section">
            <h2 className="hub-main__section-title">Operacional</h2>
            <div className="hub-main__grid">
              <div className="hub-card hub-card--disabled">
                <div className="hub-card__icon">⚙️</div>
                <h3 className="hub-card__title">Performance Operacional</h3>
                <p className="hub-card__desc">Indicadores operacionais, entregas e performance das equipes.</p>
                <span className="hub-card__status">Em breve</span>
              </div>

              <div className="hub-card hub-card--disabled">
                <div className="hub-card__icon">📑</div>
                <h3 className="hub-card__title">Relatórios</h3>
                <p className="hub-card__desc">Relatórios consolidados e históricos de toda a operação.</p>
                <span className="hub-card__status">Em breve</span>
              </div>
            </div>
          </section>
        )}
      </main>
      </div>
    </div>
  )
}
