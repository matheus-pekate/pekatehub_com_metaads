import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend } from 'recharts'
import { useRankingData } from '../hooks/useRankingData.js'
import './pkt-hub.css'
import './seller-analysis.css'
import './seller-ranking.css'

const SELLER_COLORS = ['#fe8f20', '#08373f', '#cb5b36']

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

function firstName(name) {
  return name.split(' ')[0]
}

function CustomBarTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rk-tooltip">
      <span className="rk-tooltip__label">{label}</span>
      {payload.map((p, i) => (
        <div key={i} className="rk-tooltip__row">
          <span className="rk-tooltip__dot" style={{ background: p.fill || p.color }} />
          <span>{formatter ? formatter(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

export function SellerRanking() {
  const navigate = useNavigate()
  const [segment, setSegment] = useState('b2c')
  const {
    sellers, programs, loading, sellersData, teamAvg,
    selectedProgram, setSelectedProgram,
    periodDays, setPeriodDays,
  } = useRankingData()

  // Build chart data arrays
  const revenueData = sellersData.map((s, i) => ({
    name: firstName(s.name),
    value: s.metrics.revenue,
    fill: SELLER_COLORS[i % SELLER_COLORS.length],
  }))

  const conversionData = sellersData.map((s, i) => ({
    name: firstName(s.name),
    won: s.metrics.converted,
    lost: s.metrics.lost,
    fill: SELLER_COLORS[i % SELLER_COLORS.length],
  }))

  const rateData = sellersData.map((s, i) => ({
    name: firstName(s.name),
    value: s.metrics.conversionRate,
    fill: SELLER_COLORS[i % SELLER_COLORS.length],
  }))

  const ticketData = sellersData.map((s, i) => ({
    name: firstName(s.name),
    value: s.metrics.ticketMedio,
    fill: SELLER_COLORS[i % SELLER_COLORS.length],
  }))

  const activityData = sellersData.map((s, i) => ({
    name: firstName(s.name),
    calls: s.metrics.activities.calls,
    meetings: s.metrics.activities.meetings,
    emails: s.metrics.activities.emails,
  }))

  const velocityData = sellersData.map((s, i) => ({
    name: firstName(s.name),
    value: s.metrics.velocity.avgConversionDays || 0,
    fill: SELLER_COLORS[i % SELLER_COLORS.length],
  }))

  const pipelineData = sellersData.map((s, i) => ({
    name: firstName(s.name),
    value: s.metrics.pipelineValue,
    fill: SELLER_COLORS[i % SELLER_COLORS.length],
  }))

  // Radar data — normalize to 0-100 scale
  const radarData = (() => {
    if (sellersData.length === 0) return []
    const maxRevenue = Math.max(...sellersData.map((s) => s.metrics.revenue), 1)
    const maxConverted = Math.max(...sellersData.map((s) => s.metrics.converted), 1)
    const maxRate = Math.max(...sellersData.map((s) => s.metrics.conversionRate), 1)
    const maxActivity = Math.max(...sellersData.map((s) => s.metrics.activities.total), 1)
    const maxPipeline = Math.max(...sellersData.map((s) => s.metrics.pipelineValue), 1)
    const maxCadence = Math.max(...sellersData.map((s) => s.metrics.cadence.frequency), 1)

    const dimensions = [
      { key: 'Receita', extract: (s) => (s.metrics.revenue / maxRevenue) * 100 },
      { key: 'Conversões', extract: (s) => (s.metrics.converted / maxConverted) * 100 },
      { key: 'Taxa %', extract: (s) => (s.metrics.conversionRate / maxRate) * 100 },
      { key: 'Atividades', extract: (s) => (s.metrics.activities.total / maxActivity) * 100 },
      { key: 'Pipeline', extract: (s) => (s.metrics.pipelineValue / maxPipeline) * 100 },
      { key: 'Cadência', extract: (s) => (s.metrics.cadence.frequency / maxCadence) * 100 },
    ]

    return dimensions.map((dim) => {
      const entry = { dimension: dim.key }
      sellersData.forEach((s) => {
        entry[firstName(s.name)] = Math.round(dim.extract(s))
      })
      return entry
    })
  })()

  return (
    <div className="hub-layout">
      {/* ── Sidebar ── */}
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
                <button type="button" className="hub-nav-sub__item" onClick={() => navigate('/seller-analysis')}>
                  B2C
                </button>
                <button type="button" className="hub-nav-sub__item hub-nav-sub__item--disabled" disabled>
                  B2B
                  <span className="hub-nav-item__badge">Em breve</span>
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
                <button
                  type="button"
                  className={`hub-nav-sub__item ${segment === 'b2c' ? 'hub-nav-sub__item--active' : ''}`}
                  onClick={() => setSegment('b2c')}
                >
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
            <span className="hub-strip__page">Ranking Comparativo</span>
          </div>
          <div className="hub-strip__right">
            <span className="hub-strip__status">Comercial B2C</span>
          </div>
        </div>

        <main className="rk-main">
          {/* ── Filtros ── */}
          <div className="sa-filters">
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

          {!loading && sellersData.length > 0 && (
            <>
              {/* ── Pódio ── */}
              <div className="rk-podium">
                {/* Spotlight beam behind 1st */}
                <div className="rk-podium__beam" />

                {/* Header */}
                <div className="rk-podium__header">
                  <div>
                    <span className="rk-podium__supra">TOP 3 · RECEITA GERADA</span>
                    <h3 className="rk-podium__title">Ranking Geral <span className="rk-podium__title-period">· últimos {periodDays} dias</span></h3>
                    <p className="rk-podium__desc">Ranqueado por receita gerada no período. Clique em um vendedor para abrir a análise individual.</p>
                  </div>
                  {teamAvg && (
                    <div className="rk-podium__team-badge">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      Média do time
                      <b>{formatCompactBRL(teamAvg.revenue)}</b>
                    </div>
                  )}
                </div>

                {/* Stage + Pedestals unified */}
                <div className="rk-podium__arena">
                  {[1, 0, 2].map((idx) => {
                    const s = sellersData[idx]
                    if (!s) return null
                    const rank = idx + 1
                    const initials = s.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
                    const isFirst = rank === 1
                    return (
                      <div
                        key={s.id}
                        className={`rk-podium__col rk-podium__col--r${rank}`}
                        onClick={() => navigate('/seller-analysis')}
                        role="button"
                        tabIndex={0}
                      >
                        {/* Person info */}
                        <div className="rk-podium__person">
                          {isFirst && (
                            <svg className="rk-podium__crown" width="40" height="30" viewBox="0 0 40 30" fill="none">
                              <path d="M2 24L7 8l9 7 4-13 4 13 9-7 5 16H2z" fill="#D4A843" stroke="#B8902F" strokeWidth="1"/>
                              <circle cx="7" cy="8" r="2.2" fill="#E8C85A"/><circle cx="20" cy="2" r="2.8" fill="#E8C85A"/><circle cx="33" cy="8" r="2.2" fill="#E8C85A"/>
                            </svg>
                          )}
                          <div className={`rk-podium__avatar ${isFirst ? 'rk-podium__avatar--gold' : ''}`}>
                            {s.avatarUrl
                              ? <img src={s.avatarUrl} alt={s.name} className="rk-podium__avatar-img" />
                              : initials
                            }
                            <span className="rk-podium__badge">{rank}</span>
                          </div>
                          <span className="rk-podium__name">{s.name}</span>
                          <span className="rk-podium__role">Vendedor · Comercial · B2C</span>

                          <span className="rk-podium__metric-label">RECEITA</span>
                          <span className={`rk-podium__metric-value ${isFirst ? 'rk-podium__metric-value--lg' : ''}`}>
                            {formatBRLFull(s.metrics.revenue)}
                          </span>

                          <div className="rk-podium__sub-stats">
                            <span>{s.metrics.converted} won · {s.metrics.conversionRate}% taxa</span>
                            <span>{s.metrics.openDeals} abertos · {s.metrics.activities.total} atividades</span>
                          </div>
                        </div>

                        {/* Pedestal */}
                        <div className={`rk-podium__pedestal rk-podium__pedestal--${rank}`}>
                          <span className="rk-podium__pedestal-num">{rank}º</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* ── Radar / Visão geral ── */}
              <div className="rk-section">
                <h3 className="rk-section__title">
                  Perfil comparativo
                  <span className="rk-section__sub">· visão multidimensional</span>
                </h3>
                <div className="rk-radar-wrap">
                  <ResponsiveContainer width="100%" height={340}>
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
                      <PolarGrid stroke="rgba(48,50,51,.10)" />
                      <PolarAngleAxis
                        dataKey="dimension"
                        tick={{ fontSize: 12, fill: '#366368' }}
                      />
                      {sellersData.map((s, i) => (
                        <Radar
                          key={s.id}
                          name={firstName(s.name)}
                          dataKey={firstName(s.name)}
                          stroke={SELLER_COLORS[i % SELLER_COLORS.length]}
                          fill={SELLER_COLORS[i % SELLER_COLORS.length]}
                          fillOpacity={0.12}
                          strokeWidth={2}
                        />
                      ))}
                      <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                      />
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid rgba(48,50,51,.12)' }}
                        formatter={(v) => `${v}%`}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ── KPI Bars Row ── */}
              <div className="rk-section">
                <h3 className="rk-section__title">
                  Comparativo de KPIs
                  <span className="rk-section__sub">· receita, conversão, taxa e ticket</span>
                </h3>
                <div className="rk-charts-grid">
                  {/* Receita */}
                  <div className="rk-chart-card">
                    <h4 className="rk-chart-card__title">Receita gerada</h4>
                    {teamAvg && <span className="rk-chart-card__bench">Média: {formatCompactBRL(teamAvg.revenue)}</span>}
                    <div className="rk-chart-card__body">
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={revenueData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#366368' }} axisLine={false} tickLine={false} />
                          <YAxis hide />
                          <Tooltip content={<CustomBarTooltip formatter={formatCompactBRL} />} />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={52}>
                            {revenueData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Conversões */}
                  <div className="rk-chart-card">
                    <h4 className="rk-chart-card__title">Conversões (Won / Lost)</h4>
                    {teamAvg && <span className="rk-chart-card__bench">Média Won: {teamAvg.converted}</span>}
                    <div className="rk-chart-card__body">
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={conversionData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#366368' }} axisLine={false} tickLine={false} />
                          <YAxis hide />
                          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid rgba(48,50,51,.12)' }} />
                          <Bar dataKey="won" stackId="a" fill="#2d6a4f" radius={[0, 0, 0, 0]} maxBarSize={52} name="Won" />
                          <Bar dataKey="lost" stackId="a" fill="#c0392b" radius={[6, 6, 0, 0]} maxBarSize={52} name="Lost" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Taxa de conversão */}
                  <div className="rk-chart-card">
                    <h4 className="rk-chart-card__title">Taxa de conversão</h4>
                    {teamAvg && <span className="rk-chart-card__bench">Média: {teamAvg.conversionRate}%</span>}
                    <div className="rk-chart-card__body">
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={rateData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#366368' }} axisLine={false} tickLine={false} />
                          <YAxis hide />
                          <Tooltip content={<CustomBarTooltip formatter={(v) => `${v}%`} />} />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={52}>
                            {rateData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Ticket Médio */}
                  <div className="rk-chart-card">
                    <h4 className="rk-chart-card__title">Ticket médio</h4>
                    {teamAvg && <span className="rk-chart-card__bench">Média: {formatCompactBRL(teamAvg.ticketMedio)}</span>}
                    <div className="rk-chart-card__body">
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={ticketData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#366368' }} axisLine={false} tickLine={false} />
                          <YAxis hide />
                          <Tooltip content={<CustomBarTooltip formatter={formatCompactBRL} />} />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={52}>
                            {ticketData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Atividade e cadência ── */}
              <div className="rk-section">
                <h3 className="rk-section__title">
                  Atividade e cadência
                  <span className="rk-section__sub">· volume por canal e frequência</span>
                </h3>
                <div className="rk-charts-grid rk-charts-grid--2col">
                  {/* Atividades por canal */}
                  <div className="rk-chart-card">
                    <h4 className="rk-chart-card__title">Atividades por canal</h4>
                    <div className="rk-chart-card__body">
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={activityData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#366368' }} axisLine={false} tickLine={false} />
                          <YAxis hide />
                          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid rgba(48,50,51,.12)' }} />
                          <Bar dataKey="calls" stackId="a" fill="#fe8f20" radius={[0, 0, 0, 0]} maxBarSize={52} name="Ligações" />
                          <Bar dataKey="meetings" stackId="a" fill="#08373f" radius={[0, 0, 0, 0]} maxBarSize={52} name="Reuniões" />
                          <Bar dataKey="emails" stackId="a" fill="#a0a0a0" radius={[6, 6, 0, 0]} maxBarSize={52} name="E-mails" />
                          <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Cadência e Velocidade */}
                  <div className="rk-chart-card">
                    <h4 className="rk-chart-card__title">Velocidade de conversão</h4>
                    {teamAvg?.avgConvDays && <span className="rk-chart-card__bench">Média: {teamAvg.avgConvDays} dias</span>}
                    <div className="rk-chart-card__body">
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={velocityData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#366368' }} axisLine={false} tickLine={false} />
                          <YAxis hide />
                          <Tooltip content={<CustomBarTooltip formatter={(v) => `${v} dias`} />} />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={52}>
                            {velocityData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Tabela detalhada ── */}
              <div className="rk-section">
                <h3 className="rk-section__title">
                  Detalhamento
                  <span className="rk-section__sub">· todas as métricas lado a lado</span>
                </h3>
                <div className="rk-table-wrap">
                  <table className="rk-table">
                    <thead>
                      <tr>
                        <th className="rk-table__th rk-table__th--metric">Métrica</th>
                        {sellersData.map((s, i) => (
                          <th key={s.id} className="rk-table__th" style={{ color: SELLER_COLORS[i % SELLER_COLORS.length] }}>
                            {firstName(s.name)}
                          </th>
                        ))}
                        {teamAvg && <th className="rk-table__th rk-table__th--team">Média</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: 'Receita', extract: (s) => formatBRLFull(s.metrics.revenue), avg: teamAvg ? formatBRLFull(teamAvg.revenue) : '—' },
                        { label: 'Conversões (Won)', extract: (s) => s.metrics.converted, avg: teamAvg ? teamAvg.converted : '—' },
                        { label: 'Lost', extract: (s) => s.metrics.lost, avg: teamAvg ? Math.round(sellersData.reduce((sum, d) => sum + d.metrics.lost, 0) / sellersData.length * 10) / 10 : '—' },
                        { label: 'Taxa de conversão', extract: (s) => `${s.metrics.conversionRate}%`, avg: teamAvg ? `${teamAvg.conversionRate}%` : '—' },
                        { label: 'Ticket médio', extract: (s) => formatBRLFull(s.metrics.ticketMedio), avg: teamAvg ? formatBRLFull(teamAvg.ticketMedio) : '—' },
                        { label: 'Carteira ativa', extract: (s) => `${s.metrics.openDeals} leads`, avg: teamAvg ? `${teamAvg.openDeals} leads` : '—' },
                        { label: 'Pipeline', extract: (s) => formatCompactBRL(s.metrics.pipelineValue), avg: teamAvg ? formatCompactBRL(teamAvg.pipelineValue) : '—' },
                        { label: 'Total atividades', extract: (s) => s.metrics.activities.total, avg: teamAvg ? teamAvg.totalActivities : '—' },
                        { label: 'Ligações', extract: (s) => s.metrics.activities.calls, avg: '—' },
                        { label: 'Reuniões', extract: (s) => s.metrics.activities.meetings, avg: '—' },
                        { label: 'E-mails', extract: (s) => s.metrics.activities.emails, avg: '—' },
                        { label: 'Cadência (cont./lead)', extract: (s) => s.metrics.cadence.frequency, avg: teamAvg ? teamAvg.cadenceFreq : '—' },
                        { label: 'Tempo conversão', extract: (s) => s.metrics.velocity.avgConversionDays != null ? `${s.metrics.velocity.avgConversionDays}d` : '—', avg: teamAvg?.avgConvDays != null ? `${teamAvg.avgConvDays}d` : '—' },
                        { label: 'Deals estagnados', extract: (s) => s.metrics.velocity.stagnantCount, avg: '—' },
                        { label: 'Valor estagnado', extract: (s) => formatCompactBRL(s.metrics.velocity.stagnantValue), avg: '—' },
                      ].map((row, ri) => {
                        // Find best value for highlighting
                        const values = sellersData.map((s) => row.extract(s))
                        return (
                          <tr key={ri} className={ri % 2 === 0 ? '' : 'rk-table__row--alt'}>
                            <td className="rk-table__td rk-table__td--metric">{row.label}</td>
                            {sellersData.map((s, si) => (
                              <td key={s.id} className="rk-table__td">{row.extract(s)}</td>
                            ))}
                            {teamAvg && <td className="rk-table__td rk-table__td--team">{row.avg}</td>}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
