import { formatBRL, formatCompactBRL } from '../pekate-dash/format.js'

export function ProgramSummaryCard({ program }) {
  const {
    name,
    accentColor,
    totalWonValue = 0,
    wonCount = 0,
    avgTicket = 0,
    conversionRate = 0,
    forecastValue = 0,
    forecastCount = 0,
    totalOpenCount = 0,
    stagesData = [],
  } = program

  return (
    <article className="pktb2b-card" style={{ '--pgm-accent': accentColor }}>
      <header className="pktb2b-card__head">
        <h3 className="pktb2b-card__title">{name}</h3>
        <span className="pktb2b-card__active">{totalOpenCount} ativos</span>
      </header>

      <div className="pktb2b-card__kpis">
        <div className="pktb2b-kpi">
          <span className="pktb2b-kpi__label">Receita ganha</span>
          <span className="pktb2b-kpi__value">{formatCompactBRL(totalWonValue)}</span>
          <span className="pktb2b-kpi__sub">
            <strong>{wonCount}</strong> {wonCount === 1 ? 'negócio fechado' : 'negócios fechados'}
          </span>
        </div>
        <div className="pktb2b-kpi">
          <span className="pktb2b-kpi__label">Ticket médio</span>
          <span className="pktb2b-kpi__value">{formatBRL(avgTicket)}</span>
        </div>
        <div className="pktb2b-kpi">
          <span className="pktb2b-kpi__label">Taxa de conversão</span>
          <span className="pktb2b-kpi__value">{conversionRate.toFixed(1).replace('.', ',')}<small>%</small></span>
        </div>
        <div className="pktb2b-kpi">
          <span className="pktb2b-kpi__label">Forecast em aberto</span>
          <span className="pktb2b-kpi__value">{formatCompactBRL(forecastValue)}</span>
          <span className="pktb2b-kpi__sub">
            <strong>{forecastCount}</strong> {forecastCount === 1 ? 'lead avançado' : 'leads avançados'}
          </span>
        </div>
      </div>

      <div className="pktb2b-card__funnel">
        {stagesData.map((stage) => (
          <div key={stage.id} className="pktb2b-funcard">
            <span className="pktb2b-funcard__count">{stage.count}</span>
            <span className="pktb2b-funcard__name">{stage.name}</span>
          </div>
        ))}
      </div>
    </article>
  )
}
