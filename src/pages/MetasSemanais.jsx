import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useWeeklyGoals } from '../hooks/useWeeklyGoals.js'
import { useWeeklyGoalsB2B } from '../hooks/useWeeklyGoalsB2B.js'
import './pkt-hub.css'
import './seller-analysis.css'
import './seller-ranking.css'
import './metas-semanais.css'

function formatBRLFull(value) {
  if (value == null) return 'R$ 0,00'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
}

function formatCompactBRL(value) {
  if (value == null) return 'R$ 0'
  const abs = Math.abs(value)
  if (abs >= 1000000) return `R$ ${(value / 1000000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}M`
  if (abs >= 1000) return `R$ ${(value / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`
  return formatBRLFull(value)
}

function formatWeekLabel(start, end) {
  const last = new Date(end.getTime() - 1)
  const opts = { day: '2-digit', month: 'short' }
  return `${start.toLocaleDateString('pt-BR', opts)} – ${last.toLocaleDateString('pt-BR', opts)}`
}

function goalTargetLabel(goal, metricLabelPlural = 'negócios') {
  if (!goal) return null
  return goal.metric === 'sum' ? formatCompactBRL(goal.target) : `${goal.target} ${metricLabelPlural}`
}

function goalSourceLabel(goal) {
  if (!goal) return null
  if (goal.source === 'weekly') return 'meta semanal · Pipedrive'
  if (goal.source === 'monthly') return 'estimativa · meta mensal ÷ 4,3'
  return 'estimativa · meta anual ÷ 52'
}

function GoalCell({ goal, metricLabelPlural }) {
  if (!goal) return <span className="mw-standby">Standby — meta não configurada no Pipedrive</span>
  return (
    <div className="mw-goal">
      <span className="mw-goal__value">{goalTargetLabel(goal, metricLabelPlural)}</span>
      <span className={`mw-goal__tag ${goal.estimated ? 'mw-goal__tag--estimated' : 'mw-goal__tag--live'}`}>
        {goalSourceLabel(goal)}
      </span>
    </div>
  )
}

function ProgressCell({ pct }) {
  if (pct == null) return <span className="mw-dash">—</span>
  const barPct = Math.min(100, Math.max(0, pct))
  return (
    <div className="mw-progress">
      <div className="mw-progress__bar">
        <div className={`mw-progress__fill ${pct >= 100 ? 'mw-progress__fill--done' : ''}`} style={{ width: `${barPct}%` }} />
      </div>
      <span className="mw-progress__pct">{pct}%</span>
    </div>
  )
}

function CadenceCell({ value, notApplicable }) {
  if (notApplicable) return <span className="mw-dash">não se aplica</span>
  if (value == null) {
    return (
      <span className="mw-dash" title="Sem negócios ganhos suficientes no período de referência para calcular a média">
        dados insuficientes
      </span>
    )
  }
  return (
    <div className="mw-cadence">
      <span className="mw-cadence__num">{value}</span>
      <span className="mw-cadence__unit">contatos / negócio fechado</span>
    </div>
  )
}

function MetricRow({ indent, programLabel, programDot, metricTag, goal, count, metricLabelPlural, revenue, showRevenue, progressPct, cadenceValue, cadenceNotApplicable }) {
  return (
    <tr className={`mw-row ${indent ? 'mw-row--program' : 'mw-row--total'}`}>
      <td className="mw-td mw-td--program">
        <span className={`mw-program-badge ${indent ? '' : 'mw-program-badge--total'}`}>
          {programDot && <span className="mw-program-badge__dot" style={{ background: programDot }} />}
          {programLabel}
        </span>
        <span className="mw-metric-tag">{metricTag}</span>
      </td>
      <td className="mw-td"><GoalCell goal={goal} metricLabelPlural={metricLabelPlural} /></td>
      <td className="mw-td">
        <div className="mw-actual">
          <span className="mw-actual__won">{count} {metricLabelPlural}</span>
          {showRevenue && <span className="mw-actual__rev">{formatCompactBRL(revenue)}</span>}
        </div>
      </td>
      <td className="mw-td mw-td--progress"><ProgressCell pct={progressPct} /></td>
      <td className="mw-td mw-td--cadence"><CadenceCell value={cadenceValue} notApplicable={cadenceNotApplicable} /></td>
    </tr>
  )
}

function SellerBlock({ row }) {
  const initials = row.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  const isActivityMetric = row.metricType === 'activity'

  return (
    <div className="mw-seller-block">
      <div className="mw-seller-block__header">
        <div className="mw-seller">
          <div className="mw-seller__avatar">
            {row.avatarUrl ? <img src={row.avatarUrl} alt={row.name} /> : initials}
          </div>
          <span className="mw-seller__name">{row.name}</span>
          {isActivityMetric && <span className="mw-seller__role">SDR · meta de {row.metricLabel}</span>}
        </div>
        <div className="mw-seller-block__totals">
          {isActivityMetric ? (
            <span className="mw-seller-block__totals-item"><b>{row.wonThisWeek}</b> {row.metricLabelPlural}</span>
          ) : (
            <>
              <span className="mw-seller-block__totals-item"><b>{row.closed.wonThisWeek}</b> negócios fechados</span>
              <span className="mw-seller-block__totals-item"><b>{row.qualified.countThisWeek}</b> leads qualificados</span>
              <span className="mw-seller-block__totals-item"><b>{formatCompactBRL(row.closed.revenueThisWeek)}</b> na semana</span>
            </>
          )}
        </div>
      </div>

      <div className="mw-table-wrap">
        <table className="mw-table">
          <thead>
            <tr>
              <th className="mw-th mw-th--program">Programa · meta</th>
              <th className="mw-th">Meta semanal</th>
              <th className="mw-th">Realizado</th>
              <th className="mw-th">% da meta</th>
              <th className="mw-th">Cadência até fechar</th>
            </tr>
          </thead>
          <tbody>
            {isActivityMetric && (
              <>
                <tr className="mw-row mw-row--total">
                  <td className="mw-td mw-td--program">
                    <span className="mw-program-badge mw-program-badge--total">Total</span>
                    <span className="mw-metric-tag">{row.metricLabel}</span>
                  </td>
                  <td className="mw-td"><GoalCell goal={row.goal} metricLabelPlural={row.metricLabelPlural} /></td>
                  <td className="mw-td">
                    <div className="mw-actual">
                      <span className="mw-actual__won">{row.wonThisWeek} {row.metricLabelPlural}</span>
                    </div>
                  </td>
                  <td className="mw-td mw-td--progress"><ProgressCell pct={row.progressPct} /></td>
                  <td className="mw-td mw-td--cadence"><CadenceCell notApplicable /></td>
                </tr>
                <tr className="mw-row">
                  <td className="mw-td mw-td--program" colSpan={5}>
                    <span className="mw-dash">
                      Conta atividades tipo "Reunião" com Lucas Braga como dono e o campo SDR do negócio vinculado marcado como "Lucas" — sem quebra por programa.
                    </span>
                  </td>
                </tr>
              </>
            )}

            {!isActivityMetric && (
              <>
                <MetricRow
                  programLabel="Total (todos os programas)" metricTag="Negócio fechado"
                  goal={row.closed.goal} count={row.closed.wonThisWeek} metricLabelPlural="negócios"
                  revenue={row.closed.revenueThisWeek} showRevenue
                  progressPct={row.closed.progressPct} cadenceValue={row.closed.avgContactsPerDeal}
                />
                <MetricRow
                  programLabel="Total (todos os programas)" metricTag="Leads qualificados"
                  goal={row.qualified.goal} count={row.qualified.countThisWeek} metricLabelPlural="leads"
                  progressPct={row.qualified.progressPct} cadenceNotApplicable
                />

                {row.programs.flatMap((p) => [
                  <MetricRow
                    key={`${p.programId}-closed`} indent
                    programLabel={p.shortName} programDot={p.accentColor} metricTag="Negócio fechado"
                    goal={p.closed.goal} count={p.closed.wonThisWeek} metricLabelPlural="negócios"
                    revenue={p.closed.revenueThisWeek} showRevenue
                    progressPct={p.closed.progressPct} cadenceValue={p.closed.avgContactsPerDeal}
                  />,
                  <MetricRow
                    key={`${p.programId}-qualified`} indent
                    programLabel={p.shortName} programDot={p.accentColor} metricTag="Leads qualificados"
                    goal={p.qualified.goal} count={p.qualified.countThisWeek} metricLabelPlural="leads"
                    progressPct={p.qualified.progressPct} cadenceNotApplicable
                  />,
                ])}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SegmentPanel({ segment, data }) {
  const { rows, loading, goalsUnavailable, weekStart, weekEnd, activityLookbackDays } = data
  const dealRows = rows.filter((r) => r.metricType !== 'activity')
  const activityRows = rows.filter((r) => r.metricType === 'activity')
  const teamWon = dealRows.reduce((sum, r) => sum + r.closed.wonThisWeek, 0)
  const teamRevenue = dealRows.reduce((sum, r) => sum + r.closed.revenueThisWeek, 0)
  const teamQualified = dealRows.reduce((sum, r) => sum + r.qualified.countThisWeek, 0)
  const cadenceValues = dealRows.filter((r) => r.closed.avgContactsPerDeal != null).map((r) => r.closed.avgContactsPerDeal)
  const teamCadence = cadenceValues.length > 0
    ? Math.round((cadenceValues.reduce((a, b) => a + b, 0) / cadenceValues.length) * 10) / 10
    : null
  const standbyCount = dealRows.filter((r) => !r.closed.goal).length + activityRows.filter((r) => !r.goal).length

  return (
    <div className="mw-panel">
      <div className="mw-panel__header">
        <div>
          <h3 className="mw-panel__title">{segment}</h3>
          <span className="mw-panel__week">Semana de {!loading && formatWeekLabel(weekStart, weekEnd)}</span>
        </div>
        {!loading && standbyCount > 0 && (
          <span className="mw-panel__standby-note">
            {standbyCount} de {rows.length} vendedor{standbyCount > 1 ? 'es' : ''} sem meta geral cadastrada no Pipedrive
          </span>
        )}
      </div>

      {loading && <div className="sa-loading">Carregando dados do Pipedrive...</div>}

      {!loading && (
        <>
          {goalsUnavailable && (
            <div className="mw-alert">
              Não foi possível consultar as metas do Pipedrive agora — todas as linhas abaixo estão em standby por precaução.
            </div>
          )}

          <div className="mw-kpis">
            <div className="mw-kpi">
              <span className="mw-kpi__label">Negócios fechados na semana</span>
              <span className="mw-kpi__value">{teamWon}</span>
            </div>
            <div className="mw-kpi">
              <span className="mw-kpi__label">Receita da semana</span>
              <span className="mw-kpi__value">{formatCompactBRL(teamRevenue)}</span>
            </div>
            <div className="mw-kpi">
              <span className="mw-kpi__label">Leads qualificados na semana</span>
              <span className="mw-kpi__value">{teamQualified}</span>
            </div>
            <div className="mw-kpi">
              <span className="mw-kpi__label">Média de contatos p/ fechar 1 negócio</span>
              <span className="mw-kpi__value">{teamCadence != null ? teamCadence : '—'}</span>
              <span className="mw-kpi__detail">média do time · últimos {activityLookbackDays} dias</span>
            </div>
            {activityRows.length > 0 && (
              <div className="mw-kpi">
                <span className="mw-kpi__label">Reuniões agendadas (SDR) na semana</span>
                <span className="mw-kpi__value">{activityRows.reduce((sum, r) => sum + r.wonThisWeek, 0)}</span>
                <span className="mw-kpi__detail">{activityRows.map((r) => r.name).join(', ')}</span>
              </div>
            )}
          </div>

          <div className="mw-sellers">
            {rows.map((row) => <SellerBlock key={row.id} row={row} />)}
          </div>
        </>
      )}
    </div>
  )
}

export function MetasSemanais() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialSegment = searchParams.get('segment') === 'b2b'
    ? 'b2b'
    : searchParams.get('segment') === 'b2c'
      ? 'b2c'
      : 'ambos'
  const [segment, setSegment] = useState(initialSegment)

  const dataB2C = useWeeklyGoals({ enabled: segment !== 'b2b' })
  const dataB2B = useWeeklyGoalsB2B({ enabled: segment !== 'b2c' })

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
                  <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>
                </svg>
                <span>Metas Semanais</span>
              </div>
              <div className="hub-nav-sub">
                <button
                  type="button"
                  className={`hub-nav-sub__item ${segment === 'ambos' ? 'hub-nav-sub__item--active' : ''}`}
                  onClick={() => setSegment('ambos')}
                >
                  B2C + B2B
                </button>
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
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span>Análise Individual</span>
              </div>
              <div className="hub-nav-sub">
                <button type="button" className="hub-nav-sub__item" onClick={() => navigate('/seller-analysis')}>B2C</button>
                <button type="button" className="hub-nav-sub__item" onClick={() => navigate('/seller-analysis?segment=b2b')}>B2B</button>
              </div>
            </div>
            <div className="hub-nav-group">
              <div className="hub-nav-item hub-nav-item--parent hub-nav-item--open">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span>Ranking Comparativo</span>
              </div>
              <div className="hub-nav-sub">
                <button type="button" className="hub-nav-sub__item" onClick={() => navigate('/seller-ranking')}>B2C</button>
                <button type="button" className="hub-nav-sub__item" onClick={() => navigate('/seller-ranking?segment=b2b')}>B2B</button>
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
            <span className="hub-strip__page">Metas Semanais</span>
          </div>
          <div className="hub-strip__right">
            <span className="hub-strip__status">Comercial</span>
          </div>
        </div>

        <main className="mw-main">
          <p className="mw-intro">
            Duas metas semanais por programa, para cada vendedor: <b>negócio fechado</b> e <b>leads qualificados</b>
            (deal que chegou ou passou do estágio "Qualificado"), sempre comparadas ao que já foi realizado na semana
            corrente. A cadência de contatos até fechar 1 negócio também é calculada por programa. Todos os programas
            configurados aparecem pra todo mundo — mesmo sem histórico ainda —, então o painel já funciona quando uma
            nova turma/ano começar. Vendedores/programas sem meta ativa no Pipedrive ficam em <b>standby</b> em vez de
            receber um número inventado.
          </p>

          {(segment === 'ambos' || segment === 'b2c') && <SegmentPanel segment="B2C" data={dataB2C} />}
          {(segment === 'ambos' || segment === 'b2b') && <SegmentPanel segment="B2B" data={dataB2B} />}
        </main>
      </div>
    </div>
  )
}
