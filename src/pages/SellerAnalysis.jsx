import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AreaChart, Area, XAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts'
import { useSellerData } from '../hooks/useSellerData.js'
import { useSellerDataB2B } from '../hooks/useSellerDataB2B.js'
import { useSellerInsights } from '../hooks/useSellerInsights.js'
import './pkt-hub.css'
import './seller-analysis.css'

function formatBRL(value) {
  if (value == null) return 'R$ 0'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })
}

function formatBRLFull(value) {
  if (value == null) return 'R$ 0,00'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
}

function formatCompactBRL(value) {
  if (value == null) return 'R$ 0'
  const abs = Math.abs(value)
  if (abs >= 1000000) return `R$ ${(value / 1000000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}M`
  if (abs >= 1000) return `R$ ${(value / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`
  return formatBRL(value)
}

const STAGE_COLORS = {
  'Cliente Potencial': '#f5dfc1',
  'Qualificado': '#fe8f20',
  'Em Negociação': '#cb5b36',
  'Inscrito': '#08373f',
  'Entrevista': '#2d6a4f',
  'Efetivado': '#1a2a36',
}

// Programas B2B têm listas de stages distintas por pipeline (sem nome canônico
// compartilhado) — paleta categórica validada (dataviz), atribuída por posição.
const STAGE_COLORS_B2B = ['#2a78d6', '#008300', '#e87ba4', '#eda100', '#1baf7a', '#eb6834', '#4a3aa7', '#e34948']

function stageColorAt(name, index, isB2B) {
  if (isB2B) return STAGE_COLORS_B2B[index % STAGE_COLORS_B2B.length]
  return STAGE_COLORS[name] || '#ccc'
}

const DEALS_PER_PAGE = 8
const MAX_VISIBLE_PAGES = 5
const TABS = [
  { key: 'open', label: 'Abertos' },
  { key: 'won', label: 'Won' },
  { key: 'lost', label: 'Lost' },
  { key: 'stagnant', label: 'Estagnados' },
]
const SORT_OPTIONS = [
  { value: 'recent', label: 'Mais recentes' },
  { value: 'oldest', label: 'Mais antigos' },
  { value: 'value-desc', label: 'Maior valor' },
  { value: 'value-asc', label: 'Menor valor' },
]

function getVisiblePages(current, total, maxVisible = MAX_VISIBLE_PAGES) {
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  let start = Math.max(1, current - Math.floor(maxVisible / 2))
  let end = Math.min(total, start + maxVisible - 1)
  start = Math.max(1, end - maxVisible + 1)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

function DealsTable({ deals, nav }) {
  const [activeTab, setActiveTab] = useState('open')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('recent')
  const [page, setPage] = useState(1)

  // Navegação externa (clique nos insights)
  useEffect(() => {
    if (!nav) return
    if (nav.tab) setActiveTab(nav.tab)
    if (nav.sort) setSortBy(nav.sort)
    setPage(1)
  }, [nav])

  const currentList = deals[activeTab] || []

  const filtered = useMemo(() => {
    let list = currentList
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((d) => d.title.toLowerCase().includes(q))
    }
    const sorted = [...list]
    if (sortBy === 'recent') sorted.sort((a, b) => (a.daysInFunnel || 0) - (b.daysInFunnel || 0))
    else if (sortBy === 'oldest') sorted.sort((a, b) => (b.daysInFunnel || 0) - (a.daysInFunnel || 0))
    else if (sortBy === 'value-desc') sorted.sort((a, b) => b.value - a.value)
    else if (sortBy === 'value-asc') sorted.sort((a, b) => a.value - b.value)
    return sorted
  }, [currentList, search, sortBy])

  const totalPages = Math.max(1, Math.ceil(filtered.length / DEALS_PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * DEALS_PER_PAGE, safePage * DEALS_PER_PAGE)
  const visiblePages = getVisiblePages(safePage, totalPages)
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * DEALS_PER_PAGE + 1
  const rangeEnd = filtered.length === 0 ? 0 : Math.min(safePage * DEALS_PER_PAGE, filtered.length)

  const handleTabChange = (key) => { setActiveTab(key); setPage(1) }
  const handleSearchChange = (e) => { setSearch(e.target.value); setPage(1) }

  const statusLabel = (status) => {
    if (status === 'won') return 'WON'
    if (status === 'lost') return 'LOST'
    return 'ABERTO'
  }

  const statusClass = (status) => {
    if (status === 'won') return 'won'
    if (status === 'lost') return 'lost'
    return 'open'
  }

  return (
    <div className="sa-section">
      <div className="sa-deals">
        <div className="sa-deals__header">
          <h3 className="sa-deals__title">Deals</h3>
          <span className="sa-deals__subtitle">filtrar e ordenar a carteira deste vendedor</span>
        </div>

        <div className="sa-deals__tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`sa-deals__tab ${activeTab === t.key ? 'sa-deals__tab--active' : ''}`}
              onClick={() => handleTabChange(t.key)}
            >
              {t.label}
              <span className="sa-deals__tab-count">({(deals[t.key] || []).length})</span>
            </button>
          ))}
        </div>

        <div className="sa-deals__toolbar">
          <div className="sa-deals__search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Buscar por deal ou pessoa..."
              value={search}
              onChange={handleSearchChange}
              className="sa-deals__search-input"
            />
          </div>
          <div className="sa-deals__sort">
            <span className="sa-deals__sort-label">Ordenar:</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sa-deals__sort-select">
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div className="sa-deals__table-wrap">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Deal</th>
                <th>Status</th>
                <th>Valor</th>
                <th>Stage</th>
                <th>Dias no funil</th>
                <th className="sa-table__actions-head" aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {paginated.map((d) => (
                <tr key={d.id}>
                  <td>
                    <div className="sa-table__deal">
                      <span className="sa-table__name">{d.title}</span>
                      {d.addLabel && <span className="sa-table__sub">{d.addLabel}</span>}
                    </div>
                  </td>
                  <td>
                    <span className={`sa-status sa-status--${statusClass(d.status)}`}>
                      {statusLabel(d.status)}
                    </span>
                  </td>
                  <td>{formatBRLFull(d.value)}</td>
                  <td><span className="sa-stage-badge">{d.stageName}</span></td>
                  <td>{d.daysInFunnel != null ? `${d.daysInFunnel}d` : '—'}</td>
                  <td className="sa-table__actions">
                    <button type="button" className="sa-table__menu-btn" aria-label="Mais opções">⋮</button>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={6} className="sa-table__empty">Nenhum deal encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="sa-deals__pagination">
          <span className="sa-deals__pagination-info">
            Mostrando <b>{rangeStart}–{rangeEnd}</b> de {filtered.length}
          </span>
          {totalPages > 1 && (
            <div className="sa-deals__pagination-pages">
              <button type="button" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} className="sa-deals__page-btn" aria-label="Página anterior">‹</button>
              {visiblePages.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`sa-deals__page-btn ${p === safePage ? 'sa-deals__page-btn--active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button type="button" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} className="sa-deals__page-btn" aria-label="Próxima página">›</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function SellerAnalysis() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [segment, setSegment] = useState(searchParams.get('segment') === 'b2b' ? 'b2b' : 'b2c')
  const isB2B = segment === 'b2b'

  const dataB2C = useSellerData({ enabled: !isB2B })
  const dataB2B = useSellerDataB2B({ enabled: isB2B })
  const {
    sellers, programs, loading, seller, avatarUrl, metrics, currentRank, teamBenchmark, teamCadence, teamConversionDays,
    selectedSeller, setSelectedSeller,
    selectedProgram, setSelectedProgram,
    periodDays, setPeriodDays,
  } = isB2B ? dataB2B : dataB2C

  const { insights, counts, total: insightsTotal } = useSellerInsights(
    metrics, teamBenchmark, teamCadence, teamConversionDays, periodDays, selectedProgram, programs
  )

  const stageColorMap = useMemo(() => {
    const map = {}
    ;(metrics?.portfolio?.stages || []).forEach((s, i) => { map[s.name] = stageColorAt(s.name, i, isB2B) })
    return map
  }, [metrics, isB2B])

  const [dealsNav, setDealsNav] = useState(null)

  const handleInsightClick = useCallback((action) => {
    if (!action) return
    if (action.tab || action.sort) {
      setDealsNav({ tab: action.tab, sort: action.sort, ts: Date.now() })
    }
    if (action.scrollTo) {
      setTimeout(() => {
        const el = document.getElementById(action.scrollTo)
        const container = document.querySelector('.sa-main')
        if (el && container) {
          const offset = el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - 20
          try { container.scrollTo({ top: offset, behavior: 'smooth' }) } catch (_) { /* fallback */ }
          requestAnimationFrame(() => {
            if (Math.abs(container.scrollTop - offset) > 100) container.scrollTop = offset
          })
          // Highlight visual
          document.querySelectorAll('.sa-highlight').forEach((e) => e.classList.remove('sa-highlight'))
          el.classList.add('sa-highlight')
          setTimeout(() => el.classList.remove('sa-highlight'), 2500)
        }
      }, 50)
    }
  }, [])

  const initials = seller
    ? seller.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : ''

  return (
    <div className="hub-layout">
      {/* ── Sidebar (herdado do HUB) ── */}
      <aside className="hub-sidebar">
        <div className="hub-sidebar__top">
          <div className="hub-sidebar__brand">
            <img src="/pekate-logo.png" alt="Pekatê" className="hub-sidebar__logo" />
            <div>
              <span className="hub-sidebar__brand-name">HUB</span>
              <span className="hub-sidebar__brand-sub">Pekatê Brasil</span>
            </div>
          </div>
          <nav className="hub-sidebar__nav">
            <button className="hub-nav-item" onClick={() => navigate('/pkt-hub')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12L12 3l9 9M5 10v10a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V10"/>
              </svg>
              <span>Home</span>
            </button>
            <div className="hub-nav-group">
              <div className="hub-nav-item hub-nav-item--parent hub-nav-item--open">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span>Análise Individual</span>
              </div>
              <div className="hub-nav-sub">
                <button
                  type="button"
                  className={`hub-nav-sub__item ${segment === 'b2c' ? 'hub-nav-sub__item--active' : ''}`}
                  onClick={() => setSegment('b2c')}
                >
                  B2C
                </button>
                <button
                  type="button"
                  className={`hub-nav-sub__item ${segment === 'b2b' ? 'hub-nav-sub__item--active' : ''}`}
                  onClick={() => setSegment('b2b')}
                >
                  B2B
                </button>
              </div>
            </div>
            <div className="hub-nav-group">
              <div className="hub-nav-item hub-nav-item--parent hub-nav-item--open">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20V10M18 20V4M6 20v-6"/>
                </svg>
                <span>Ranking Comparativo</span>
              </div>
              <div className="hub-nav-sub">
                <button type="button" className="hub-nav-sub__item" onClick={() => navigate('/seller-ranking')}>
                  B2C
                </button>
                <button type="button" className="hub-nav-sub__item hub-nav-sub__item--disabled" disabled>
                  B2B
                  <span className="hub-nav-item__badge">Em breve</span>
                </button>
              </div>
            </div>
          </nav>
        </div>
      </aside>

      {/* ── Right column ── */}
      <div className="hub-right">
        <div className="hub-strip">
          <div className="hub-strip__left">
            <button className="sa-back" onClick={() => navigate('/pkt-hub')} title="Voltar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <span className="hub-strip__page">Análise dos Vendedores</span>
          </div>
          <div className="hub-strip__right">
            <span className="hub-strip__status">Comercial {isB2B ? 'B2B' : 'B2C'}</span>
          </div>
        </div>

        <div className="sa-body">
        <main className="sa-main">
          {/* ── Filtros ── */}
          <div className="sa-filters">
            <div className="sa-filter">
              <label className="sa-filter__label">Vendedor</label>
              <select
                className="sa-filter__select"
                value={selectedSeller}
                onChange={(e) => setSelectedSeller(Number(e.target.value))}
              >
                {sellers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="sa-filter">
              <label className="sa-filter__label">Programa</label>
              <select
                className="sa-filter__select"
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
              >
                <option value="">Todos</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>{p.shortName}</option>
                ))}
              </select>
            </div>

            <div className="sa-filter">
              <label className="sa-filter__label">Período</label>
              <select
                className="sa-filter__select"
                value={periodDays}
                onChange={(e) => setPeriodDays(Number(e.target.value))}
              >
                <option value={7}>Últimos 7 dias</option>
                <option value={30}>Últimos 30 dias</option>
                <option value={90}>Últimos 90 dias</option>
                <option value={180}>Últimos 6 meses</option>
              </select>
            </div>
          </div>

          {loading && (
            <div className="sa-loading">Carregando dados do Pipedrive...</div>
          )}

          {!loading && seller && metrics && (
            <>
              {/* ── Header do vendedor ── */}
              <div className="sa-header">
                <div className="sa-header__avatar">
                  {avatarUrl
                    ? <img src={avatarUrl} alt={seller.name} className="sa-header__avatar-img" />
                    : initials
                  }
                </div>
                <div className="sa-header__info">
                  <h2 className="sa-header__name">{seller.name}</h2>
                  <span className="sa-header__sub">Vendedor · Comercial {isB2B ? 'B2B' : 'B2C'}</span>
                </div>
                {currentRank > 0 && (
                  <div className="sa-header__rank">
                    <span className="sa-header__rank-num">{currentRank}º</span>
                    <span className="sa-header__rank-label">Ranking</span>
                  </div>
                )}
              </div>

              {/* ── KPIs ── */}
              <div className="sa-kpis" id="sa-kpis">
                {/* Conversão */}
                <div className="sa-kpi">
                  <span className="sa-kpi__label">Conversão</span>
                  <div className="sa-kpi__main">
                    <span className="sa-kpi__value">{metrics.converted}</span>
                    <span className="sa-kpi__suffix">Won</span>
                  </div>
                  <div className="sa-kpi__bar">
                    <div className="sa-kpi__bar-seg sa-kpi__bar-seg--won" style={{ flex: metrics.converted || 1 }} />
                    <div className="sa-kpi__bar-seg sa-kpi__bar-seg--lost" style={{ flex: metrics.lost || 0 }} />
                    <div className="sa-kpi__bar-seg sa-kpi__bar-seg--open" style={{ flex: metrics.openDeals || 0 }} />
                  </div>
                  <div className="sa-kpi__breakdown">
                    <div className="sa-kpi__bd-item">
                      <span className="sa-kpi__bd-num">{metrics.converted}</span>
                      <span className="sa-kpi__bd-label">WON</span>
                    </div>
                    <div className="sa-kpi__bd-item">
                      <span className="sa-kpi__bd-num">{metrics.lost}</span>
                      <span className="sa-kpi__bd-label">LOST</span>
                    </div>
                    <div className="sa-kpi__bd-item">
                      <span className="sa-kpi__bd-num">{metrics.openDeals}</span>
                      <span className="sa-kpi__bd-label">ABERTOS</span>
                    </div>
                  </div>
                </div>

                {/* Receita Gerada */}
                <div className="sa-kpi">
                  <span className="sa-kpi__label">Receita Gerada</span>
                  <span className="sa-kpi__value">{formatBRLFull(metrics.revenue)}</span>
                  <span className={`sa-kpi__delta ${metrics.revenueDelta >= 0 ? 'sa-kpi__delta--up' : 'sa-kpi__delta--down'}`}>
                    {metrics.revenueDelta >= 0 ? '▲' : '▼'} {formatCompactBRL(Math.abs(metrics.revenueDelta))}
                    <span className="sa-kpi__delta-txt">vs. período anterior</span>
                  </span>
                  <span className="sa-kpi__detail">Ticket médio · {formatBRLFull(metrics.ticketMedio)}</span>
                </div>

                {/* Taxa de Conversão */}
                <div className="sa-kpi">
                  <span className="sa-kpi__label">Taxa de Conversão</span>
                  <div className="sa-kpi__main">
                    <span className="sa-kpi__value">{metrics.conversionRate}</span>
                    <span className="sa-kpi__suffix">%</span>
                  </div>
                  <span className={`sa-kpi__delta ${metrics.conversionRateDelta >= 0 ? 'sa-kpi__delta--up' : 'sa-kpi__delta--down'}`}>
                    {metrics.conversionRateDelta >= 0 ? '▲' : '▼'} {Math.abs(metrics.conversionRateDelta)} pp
                    <span className="sa-kpi__delta-txt">vs. período anterior</span>
                  </span>
                  <span className="sa-kpi__detail">Benchmark do time · {teamBenchmark}%</span>
                </div>

                {/* Carteira Ativa */}
                <div className="sa-kpi">
                  <span className="sa-kpi__label">Carteira Ativa</span>
                  <div className="sa-kpi__main">
                    <span className="sa-kpi__value">{metrics.openDeals}</span>
                    <span className="sa-kpi__suffix">leads</span>
                  </div>
                  {metrics.newThisWeek > 0 && (
                    <span className="sa-kpi__delta sa-kpi__delta--up">
                      ▲ {metrics.newThisWeek}
                      <span className="sa-kpi__delta-txt">novos esta semana</span>
                    </span>
                  )}
                  <span className="sa-kpi__detail">Pipeline · {formatBRL(metrics.pipelineValue)}</span>
                </div>
              </div>

              {/* ── Atividade e cadência ── */}
              <div className="sa-section" id="sa-activity">
                <h3 className="sa-section__title">
                  Atividade e cadência <span className="sa-section__title-sub">· últimos {periodDays} dias</span>
                </h3>
                <div className="sa-act-grid">
                  {/* Card 1 — Volume diário */}
                  <div className="sa-vol">
                    <div className="sa-vol__header">
                      <span className="sa-vol__title">VOLUME DIÁRIO · TOTAL</span>
                      <div className="sa-vol__legend">
                        <span className="sa-vol__legend-item"><span className="sa-vol__dot sa-vol__dot--vol" />Volume</span>
                        <span className="sa-vol__legend-item"><span className="sa-vol__dot sa-vol__dot--today" />Hoje</span>
                      </div>
                    </div>
                    <div className="sa-vol__total">
                      <span className="sa-vol__num">{metrics.activities.total}</span>
                      <span className="sa-vol__unit">atividades</span>
                    </div>
                    <div className="sa-vol__chart">
                      <ResponsiveContainer width="100%" height={120}>
                        <AreaChart data={metrics.dailyVolume} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                          <defs>
                            <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#fe8f20" stopOpacity={0.18} />
                              <stop offset="100%" stopColor="#fe8f20" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis
                            dataKey="daysAgo"
                            type="number"
                            domain={[-periodDays, 0]}
                            ticks={[-periodDays, -Math.round(periodDays * 2 / 3), -Math.round(periodDays / 3), 0]}
                            tickFormatter={(v) => v === 0 ? 'hoje' : `D${v}`}
                            tick={{ fontSize: 10, fill: '#366368' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            labelFormatter={(v) => v === 0 ? 'Hoje' : `${Math.abs(v)} dias atrás`}
                            formatter={(v) => [v, 'Atividades']}
                            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid rgba(48,50,51,.12)' }}
                          />
                          <Area
                            type="monotone"
                            dataKey="count"
                            stroke="#fe8f20"
                            strokeWidth={2}
                            fill="url(#volGrad)"
                            dot={(props) =>
                              props.payload.daysAgo === 0
                                ? <circle key="today" cx={props.cx} cy={props.cy} r={4} fill="#08373f" />
                                : null
                            }
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Card 2 — Mix por canal */}
                  <div className="sa-mix">
                    <h4 className="sa-mix__title">Mix por canal</h4>
                    <div className="sa-mix__rows">
                      {[
                        { label: 'Ligações', count: metrics.activities.calls, color: '#fe8f20' },
                        { label: 'Reuniões', count: metrics.activities.meetings, color: '#08373f' },
                        { label: 'E-mails', count: metrics.activities.emails, color: '#a0a0a0' },
                      ].map((ch) => (
                        <div key={ch.label} className="sa-mix__row">
                          <span className="sa-mix__dot" style={{ background: ch.color }} />
                          <span className="sa-mix__label">{ch.label}</span>
                          <div className="sa-mix__bar">
                            <div
                              className="sa-mix__bar-fill"
                              style={{
                                width: `${metrics.activities.total > 0 ? (ch.count / metrics.activities.total) * 100 : 0}%`,
                                background: ch.color,
                              }}
                            />
                          </div>
                          <span className="sa-mix__count">{ch.count}</span>
                        </div>
                      ))}
                    </div>
                    <div className="sa-mix__footer">
                      {metrics.concentration && (
                        <span>Concentração em <b>{metrics.concentration.channel}</b> ({metrics.concentration.pct}%)</span>
                      )}
                      <span className="sa-mix__bench">Sugerido: 60/30/10</span>
                    </div>
                  </div>

                  {/* Card 3 — Cadência por lead */}
                  <div className="sa-cad">
                    <h4 className="sa-cad__title">Cadência por lead</h4>
                    <div className="sa-cad__row">
                      <div className="sa-cad__metric">
                        <span className="sa-cad__metric-label">FREQUÊNCIA MÉDIA</span>
                        <div className="sa-cad__metric-val">
                          <span className="sa-cad__num">{metrics.cadence.frequency}</span>
                          <span className="sa-cad__unit">contatos/lead</span>
                        </div>
                      </div>
                      <div className="sa-cad__bench">
                        <span className="sa-cad__bench-label">Time</span>
                        <span className="sa-cad__bench-num">{teamCadence}</span>
                      </div>
                    </div>
                    <div className="sa-cad__row">
                      <div className="sa-cad__metric">
                        <span className="sa-cad__metric-label">ÚLTIMA ATIVIDADE</span>
                        <div className="sa-cad__metric-val">
                          <span className="sa-cad__num">{metrics.cadence.lastActivityDaysAgo ?? '—'}</span>
                          <span className="sa-cad__unit">dias atrás</span>
                        </div>
                      </div>
                      {(metrics.cadence.lastActivityDaysAgo === null || metrics.cadence.lastActivityDaysAgo > 3) && (
                        <span className="sa-cad__badge sa-cad__badge--warn">fora da janela</span>
                      )}
                    </div>
                    <div className="sa-cad__row">
                      <div className="sa-cad__metric">
                        <span className="sa-cad__metric-label">LEADS SEM CONTATO &gt;7D</span>
                        <div className="sa-cad__metric-val">
                          <span className="sa-cad__num">{metrics.cadence.leadsNoContact7d}</span>
                          <span className="sa-cad__unit">leads</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Velocidade do funil ── */}
              <div className="sa-section" id="sa-velocity">
                <div className="sa-section__title-row">
                  <h3 className="sa-section__title">Velocidade do funil</h3>
                  <span className="sa-section__title-sub">tempo médio por stage · benchmark do time</span>
                </div>
                <div className="sa-vel-grid">
                  {/* Card 1 — Tempo Médio de Conversão */}
                  <div className="sa-vel-conv">
                    <span className="sa-vel-conv__label">TEMPO MÉDIO DE CONVERSÃO</span>
                    <div className="sa-vel-conv__main">
                      <span className="sa-vel-conv__num">{metrics.velocity.avgConversionDays ?? '—'}</span>
                      <span className="sa-vel-conv__unit">dias</span>
                    </div>
                    <span className="sa-vel-conv__sub">do "deal criado" até o "won"</span>
                    <div className="sa-vel-conv__footer">
                      <span className="sa-vel-conv__bench">Benchmark do time</span>
                      <div className="sa-vel-conv__bench-val">
                        <span className="sa-vel-conv__bench-num">{teamConversionDays ?? '—'} dias</span>
                        {metrics.velocity.avgConversionDays != null && teamConversionDays != null && (
                          <span className={`sa-vel-conv__badge ${metrics.velocity.avgConversionDays > teamConversionDays ? 'sa-vel-conv__badge--warn' : 'sa-vel-conv__badge--ok'}`}>
                            {metrics.velocity.avgConversionDays > teamConversionDays ? '+' : ''}{metrics.velocity.avgConversionDays - teamConversionDays}d
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card 2 — Tempo médio por stage */}
                  <div className="sa-vel-stages">
                    <div className="sa-vel-stages__header">
                      <h4 className="sa-vel-stages__title">Tempo médio por stage</h4>
                      <span className="sa-vel-stages__unit">dias</span>
                    </div>
                    {metrics.velocity.stageAvgDays.length > 0 ? (
                      <>
                        <div className="sa-vel-stages__rows">
                          {metrics.velocity.stageAvgDays.map((s) => (
                            <div key={s.id} className="sa-vel-stages__row">
                              <span className="sa-vel-stages__name">{s.name}</span>
                              <div className="sa-vel-stages__bar-wrap">
                                <div
                                  className={`sa-vel-stages__bar ${metrics.velocity.gargalo && s.name === metrics.velocity.gargalo.name ? 'sa-vel-stages__bar--gargalo' : ''}`}
                                  style={{ width: `${metrics.velocity.maxStageDays > 0 ? Math.max(8, (s.days / metrics.velocity.maxStageDays) * 100) : 8}%` }}
                                >
                                  <span className="sa-vel-stages__bar-label">{s.days}d</span>
                                </div>
                              </div>
                              <span className="sa-vel-stages__days">{s.days}d</span>
                            </div>
                          ))}
                        </div>
                        {metrics.velocity.gargalo && (
                          <div className="sa-vel-stages__alert">
                            <span className="sa-vel-stages__alert-dot" />
                            <b>{metrics.velocity.gargalo.name}</b> está {metrics.velocity.gargalo.delta}d acima da meta — gargalo.
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="sa-vel-stages__empty">Selecione um programa para ver o detalhamento por stage</span>
                    )}
                  </div>

                  {/* Card 3 — Deals estagnados */}
                  <div className="sa-vel-stag">
                    <span className="sa-vel-stag__label">DEALS ESTAGNADOS</span>
                    <div className="sa-vel-stag__main">
                      <span className="sa-vel-stag__num">{metrics.velocity.stagnantCount}</span>
                      <span className="sa-vel-stag__unit">deals</span>
                    </div>
                    <span className="sa-vel-stag__sub">parados há mais de 14 dias</span>
                    <div className="sa-vel-stag__footer">
                      <span>Valor travado</span>
                      <span className="sa-vel-stag__val">{formatBRLFull(metrics.velocity.stagnantValue)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Carteira ativa ── */}
              {metrics.portfolio.stages.length > 0 && (
                <div className="sa-section">
                  <div className="sa-section__title-row">
                    <h3 className="sa-section__title">Carteira ativa</h3>
                    <span className="sa-section__title-sub">
                      {metrics.portfolio.totalCount} leads · {formatBRLFull(metrics.portfolio.totalValue)} em pipeline
                    </span>
                  </div>
                  <div className="sa-port-grid">
                    {/* Card 1 — Distribuição por stage */}
                    <div className="sa-port-dist">
                      <h4 className="sa-port-dist__title">Distribuição por stage</h4>
                      <div className="sa-port-dist__body">
                        <div className="sa-port-dist__chart">
                          <ResponsiveContainer width={160} height={160}>
                            <PieChart>
                              <Pie
                                data={metrics.portfolio.stages.filter((s) => s.count > 0)}
                                cx="50%"
                                cy="50%"
                                innerRadius={48}
                                outerRadius={72}
                                dataKey="count"
                                stroke="none"
                                startAngle={90}
                                endAngle={-270}
                              >
                                {metrics.portfolio.stages.filter((s) => s.count > 0).map((s) => (
                                  <Cell key={s.name} fill={stageColorMap[s.name] || '#ccc'} />
                                ))}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="sa-port-dist__center">
                            <span className="sa-port-dist__center-label">LEADS</span>
                            <span className="sa-port-dist__center-num">{metrics.portfolio.totalCount}</span>
                          </div>
                        </div>
                        <div className="sa-port-dist__legend">
                          {metrics.portfolio.stages.map((s) => (
                            <div key={s.name} className="sa-port-dist__legend-row">
                              <span className="sa-port-dist__legend-dot" style={{ background: stageColorMap[s.name] || '#ccc' }} />
                              <span className="sa-port-dist__legend-name">{s.name}</span>
                              <span className="sa-port-dist__legend-pct">{s.pctCount}%</span>
                              <span className="sa-port-dist__legend-count">{s.count} leads</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Card 2 — Pipeline por stage */}
                    <div className="sa-port-pipe">
                      <div className="sa-port-pipe__header">
                        <h4 className="sa-port-pipe__title">Pipeline por stage</h4>
                        <span className="sa-port-pipe__sub">valor potencial · # de leads</span>
                      </div>
                      <div className="sa-port-pipe__rows">
                        {metrics.portfolio.stages.map((s) => (
                          <div key={s.name} className="sa-port-pipe__row">
                            <span className="sa-port-pipe__name">{s.name}</span>
                            <div className="sa-port-pipe__bar-wrap">
                              <div
                                className="sa-port-pipe__bar"
                                style={{
                                  width: `${Math.max(s.pctValue, 4)}%`,
                                  background: stageColorMap[s.name] || '#ccc',
                                }}
                              >
                                <span className="sa-port-pipe__bar-label">{s.pctValue}%</span>
                              </div>
                            </div>
                            <div className="sa-port-pipe__val">
                              <span className="sa-port-pipe__val-brl">{formatCompactBRL(s.value)}</span>
                              <span className="sa-port-pipe__val-pct">{s.pctValue}% do total</span>
                            </div>
                            <span className="sa-port-pipe__count">{s.count}</span>
                          </div>
                        ))}
                      </div>
                      <div className="sa-port-pipe__footer">
                        {metrics.portfolio.topValueStage && (
                          <span>Maior concentração: <b>{metrics.portfolio.topValueStage.name}</b></span>
                        )}
                        <span>Conversão final esperada: <b>~{metrics.portfolio.expectedConversion} deals</b></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Deals (tabela unificada) ── */}
              <div id="sa-deals">
                <DealsTable deals={metrics.dealsByStatus} nav={dealsNav} />
              </div>
            </>
          )}
        </main>

        {/* ── Sidebar: A revisar ── */}
        {!loading && metrics && insightsTotal > 0 && (
          <aside className="sa-rv">
            <div className="sa-rv__header">
              <div className="sa-rv__title-row">
                <h3 className="sa-rv__title">A revisar</h3>
                <span className="sa-rv__badge-total">{insightsTotal}</span>
              </div>
              <p className="sa-rv__desc">Pontos de atenção e oportunidades detectadas no período do filtro.</p>
              <div className="sa-rv__badges">
                {counts.critical > 0 && <span className="sa-rv__sev sa-rv__sev--critical">{counts.critical} CRÍTICOS</span>}
                {counts.warning > 0 && <span className="sa-rv__sev sa-rv__sev--warning">{counts.warning} AVISOS</span>}
                {counts.opportunity > 0 && <span className="sa-rv__sev sa-rv__sev--opportunity">{counts.opportunity} OPORTUNIDADES</span>}
                {counts.insight > 0 && <span className="sa-rv__sev sa-rv__sev--insight">{counts.insight} INSIGHTS</span>}
              </div>
            </div>
            <div className="sa-rv__list">
              {insights.map((ins, i) => (
                <div
                  key={i}
                  className={`sa-rv__card sa-rv__card--${ins.severity}${ins.action ? ' sa-rv__card--clickable' : ''}`}
                  onClick={() => ins.action && handleInsightClick(ins.action)}
                  role={ins.action ? 'button' : undefined}
                  tabIndex={ins.action ? 0 : undefined}
                  onKeyDown={(e) => ins.action && (e.key === 'Enter' || e.key === ' ') && handleInsightClick(ins.action)}
                >
                  <div className="sa-rv__card-top">
                    <span className={`sa-rv__card-type sa-rv__card-type--${ins.severity}`}>{ins.type}</span>
                    <span className="sa-rv__card-time">AGORA</span>
                  </div>
                  <h4 className="sa-rv__card-title">{ins.title}</h4>
                  <p className="sa-rv__card-desc">{ins.description}</p>
                </div>
              ))}
            </div>
          </aside>
        )}
        </div>
      </div>
    </div>
  )
}
