import { formatBRL } from '../pekate-dash/format.js'

export function B2BKpiStack({ program }) {
  const {
    name,
    totalWonValue = 0,
    wonCount = 0,
    avgTicket = 0,
    forecastValue = 0,
    forecastCount = 0,
    conversionRate = 0,
  } = program || {}

  return (
    <aside className="pktb2b-kpi-stack">
      <header className="pktb2b-kpi-stack__head">
        <span className="pktb2b-kpi-stack__eyebrow">Snapshot financeiro</span>
        <h3 className="pktb2b-kpi-stack__title">{name}</h3>
      </header>

      <div className="pktb2b-kpi">
        <span className="pktb2b-kpi__label">Receita ganha no período</span>
        <span className="pktb2b-kpi__value">{formatBRL(totalWonValue)}</span>
        <span className="pktb2b-kpi__sub">
          <strong>{wonCount}</strong> {wonCount === 1 ? 'negócio fechado' : 'negócios fechados'} · ticket médio <strong>{formatBRL(avgTicket)}</strong>
        </span>
      </div>

      <div className="pktb2b-kpi">
        <span className="pktb2b-kpi__label">Forecast em aberto</span>
        <span className="pktb2b-kpi__value">{formatBRL(forecastValue)}</span>
        <span className="pktb2b-kpi__sub">
          <strong>{forecastCount}</strong> {forecastCount === 1 ? 'lead avançado' : 'leads avançados'} em negociação
        </span>
      </div>

      <div className="pktb2b-kpi">
        <span className="pktb2b-kpi__label">Taxa de conversão</span>
        <span className="pktb2b-kpi__value">
          {conversionRate.toFixed(1).replace('.', ',')}<small>%</small>
        </span>
        <span className="pktb2b-kpi__sub">
          <strong>{wonCount}</strong> {wonCount === 1 ? 'ganho' : 'ganhos'} no período
        </span>
      </div>
    </aside>
  )
}
