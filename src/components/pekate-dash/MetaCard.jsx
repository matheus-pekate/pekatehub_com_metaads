import { formatCompactBRL, daysUntilDate } from './format.js'

function EmptyState({ programName }) {
  return (
    <article className="pkt-meta-card pkt-meta-card--empty">
      <header className="pkt-meta-card__head pkt-meta-card__head--empty">
        <span className="pkt-meta-card__eyebrow">Meta de receita</span>
      </header>
      <div className="pkt-meta-card__empty-body">
        <p className="pkt-meta-card__empty-title">Meta não configurada</p>
        <p className="pkt-meta-card__empty-sub">
          Defina <code>revenueGoal</code> em <code>config/pipedrive.js</code> para o programa {programName} para visualizar este indicador.
        </p>
      </div>
    </article>
  )
}

export function MetaCard({ program }) {
  if (!program?.revenueGoal) return <EmptyState programName={program?.shortName} />

  const {
    revenueGoal,
    dynamicGoal = 0,
    totalWonValue = 0,
    forecast = 0,
    converted = 0,
    price = 0,
    avgTicket = 0,
    forecastCount = 0,
    startDate,
  } = program

  const days = Math.max(0, daysUntilDate(startDate))
  const remaining = Math.max(0, revenueGoal - totalWonValue)
  // Usa o ticket médio real (já reflete desconto) quando disponível; cai pro price de tabela antes da 1ª venda
  const effectiveTicket = avgTicket > 0 ? avgTicket : price
  const remainingStudentsByMoney = effectiveTicket ? Math.ceil(remaining / effectiveTicket) : 0
  const studentsGoalGap = Math.max(0, dynamicGoal - converted)
  const ganhoPct = Math.min(100, (totalWonValue / revenueGoal) * 100)
  const ganhoPctRound = Math.round(ganhoPct)
  const remainingPct = Math.max(0, 100 - ganhoPctRound)
  const forecastWidth = (forecast / revenueGoal) * 100

  return (
    <article className="pkt-meta-card">
      <header className="pkt-meta-card__head">
        <span className="pkt-meta-card__eyebrow">
          Meta de receita · <strong>{formatCompactBRL(revenueGoal)}</strong> · {dynamicGoal} alunos
        </span>
        <div className="pkt-meta-card__legend">
          <span><i className="pkt-meta-card__legend-dot pkt-meta-card__legend-dot--ganho"></i> Ganho</span>
          <span><i className="pkt-meta-card__legend-dot pkt-meta-card__legend-dot--forecast"></i> Forecast</span>
          <span><i className="pkt-meta-card__legend-dot pkt-meta-card__legend-dot--meta"></i> Meta</span>
        </div>
      </header>

      <div className="pkt-meta-card__body">
        <h2 className="pkt-meta-card__headline">
          Faltam <em>{formatCompactBRL(remaining)}</em> e <em>{studentsGoalGap} {studentsGoalGap === 1 ? 'aluno' : 'alunos'}</em><br />
          <span className="pkt-meta-card__lead-time">em {days} dias para {formatCompactBRL(revenueGoal)}.</span>
        </h2>
        <div className="pkt-meta-card__pct">
          <div className="pkt-meta-card__pct-num">{ganhoPctRound}<sup>%</sup></div>
          <div className="pkt-meta-card__pct-label">da meta atingida</div>
        </div>
      </div>

      <div>
        <div className="pkt-meta-card__bar">
          <div className="pkt-meta-card__layer pkt-meta-card__layer--ganho" style={{ width: `${ganhoPct}%` }}></div>
          <div className="pkt-meta-card__layer pkt-meta-card__layer--forecast" style={{ left: `${ganhoPct}%`, width: `${forecastWidth}%` }}></div>
          <div className="pkt-meta-card__meta-mark"></div>
        </div>
        <div className="pkt-meta-card__ticks">
          <span>R$ 0</span>
          <span>{formatCompactBRL(revenueGoal * 0.25)}</span>
          <span>{formatCompactBRL(revenueGoal * 0.5)}</span>
          <span>{formatCompactBRL(revenueGoal * 0.75)}</span>
          <span>{formatCompactBRL(revenueGoal)}</span>
        </div>

        <div className="pkt-meta-card__foot">
          <div className="pkt-meta-foot-cell">
            <span className="pkt-meta-foot-cell__label">Ganho</span>
            <span className="pkt-meta-foot-cell__value">{formatCompactBRL(totalWonValue)}</span>
            <span className="pkt-meta-foot-cell__sub">{converted} {converted === 1 ? 'aluno' : 'alunos'} · {ganhoPctRound}% da meta</span>
          </div>
          <div className="pkt-meta-foot-cell">
            <span className="pkt-meta-foot-cell__label">Forecast projetado</span>
            <span className="pkt-meta-foot-cell__value">{formatCompactBRL(forecast)}</span>
            <span className="pkt-meta-foot-cell__sub">{forecastCount} {forecastCount === 1 ? 'lead qualificado' : 'leads qualificados'} · cenário 100%</span>
          </div>
          <div className="pkt-meta-foot-cell pkt-meta-foot-cell--faltante">
            <span className="pkt-meta-foot-cell__label">Faltante p/ meta</span>
            <span className="pkt-meta-foot-cell__value">− {formatCompactBRL(remaining)}</span>
            <span className="pkt-meta-foot-cell__sub">{remainingStudentsByMoney} {remainingStudentsByMoney === 1 ? 'aluno' : 'alunos'} · {remainingPct}% restantes</span>
          </div>
        </div>
      </div>
    </article>
  )
}
