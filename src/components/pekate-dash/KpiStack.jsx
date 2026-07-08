import { formatBRL } from './format.js'

export function KpiStack({ program }) {
  const {
    name,
    totalWonValue = 0,
    converted = 0,
    price = 0,
    avgTicket = 0,
    discountPct = 0,
    forecast = 0,
    forecastCount = 0,
    conversionRate = 0,
    totalDealsCount = 0,
  } = program || {}

  return (
    <aside className="pkt-kpi-stack">
      <header className="pkt-kpi-stack__head">
        <span className="pkt-kpi-stack__eyebrow">Snapshot financeiro</span>
        <h3 className="pkt-kpi-stack__title">{name}</h3>
      </header>

      <div className="pkt-kpi">
        <span className="pkt-kpi__label">Total ganho</span>
        <span className="pkt-kpi__value">{formatBRL(totalWonValue)}</span>
        <span className="pkt-kpi__sub">
          <strong>{converted}</strong> {converted === 1 ? 'aluno convertido' : 'alunos convertidos'} · ticket médio <strong>{formatBRL(avgTicket)}</strong>
          {discountPct > 0.5 && (
            <> · <span className="pkt-kpi__discount">{discountPct.toFixed(0)}% de desconto</span> vs. tabela ({formatBRL(price)})</>
          )}
        </span>
      </div>

      <div className="pkt-kpi">
        <span className="pkt-kpi__label">Forecast em aberto</span>
        <span className="pkt-kpi__value">{formatBRL(forecast)}</span>
        <span className="pkt-kpi__sub">
          <strong>{forecastCount}</strong> {forecastCount === 1 ? 'lead qualificado' : 'leads qualificados'} em negociação
        </span>
      </div>

      <div className="pkt-kpi">
        <span className="pkt-kpi__label">Taxa de conversão</span>
        <span className="pkt-kpi__value">
          {conversionRate.toFixed(1).replace('.', ',')}<small>%</small>
        </span>
        <span className="pkt-kpi__sub">
          <strong>{converted}</strong> {converted === 1 ? 'ganho' : 'ganhos'} de <strong>{totalDealsCount}</strong> oportunidades criadas
        </span>
      </div>
    </aside>
  )
}
