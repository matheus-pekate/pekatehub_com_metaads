import { formatCompactBRL } from '../pekate-dash/format.js'

function EmptyState({ programName }) {
  return (
    <article className="pktb2b-meta-card pktb2b-meta-card--empty">
      <header className="pktb2b-meta-card__head">
        <span className="pktb2b-meta-card__eyebrow">Meta de receita</span>
      </header>
      <div className="pktb2b-meta-card__empty-body">
        <p className="pktb2b-meta-card__empty-title">Meta não configurada</p>
        <p className="pktb2b-meta-card__empty-sub">
          Defina <code>revenueGoal</code> em <code>config/pipedrive.js</code> para o programa {programName}.
        </p>
      </div>
    </article>
  )
}

export function B2BMetaCard({ program, isClosedYear }) {
  if (!program?.periodRevenueGoal) return <EmptyState programName={program?.name} />

  const {
    periodRevenueGoal,
    periodGoal,
    totalWonValue = 0,
    forecastValue = 0,
    wonCount = 0,
    goalPercent = 0,
    remaining = 0,
  } = program

  const ganhoPct = Math.min(100, goalPercent)
  const ganhoPctRound = Math.round(ganhoPct)
  const forecastWidth = (forecastValue / periodRevenueGoal) * 100
  const contractsGoalGap = periodGoal != null ? Math.max(0, Math.round(periodGoal) - wonCount) : null
  const metaBatida = goalPercent >= 100
  // Ano encerrado e meta não batida: fala no passado, sem sugerir que ainda dá pra bater.
  const showAsClosed = isClosedYear && !metaBatida

  return (
    <article className="pktb2b-meta-card">
      <header className="pktb2b-meta-card__head">
        <span className="pktb2b-meta-card__eyebrow">
          Meta de receita · <strong>{formatCompactBRL(periodRevenueGoal)}</strong>
          {periodGoal != null && <> · {Math.round(periodGoal)} contratos</>}
        </span>
        <div className="pktb2b-meta-card__legend">
          <span><i className="pktb2b-meta-card__legend-dot pktb2b-meta-card__legend-dot--ganho"></i> Ganho</span>
          <span><i className="pktb2b-meta-card__legend-dot pktb2b-meta-card__legend-dot--forecast"></i> Forecast</span>
          <span><i className="pktb2b-meta-card__legend-dot pktb2b-meta-card__legend-dot--meta"></i> Meta</span>
        </div>
      </header>

      <div className="pktb2b-meta-card__body">
        <h2 className="pktb2b-meta-card__headline">
          {showAsClosed ? (
            <>
              Faltaram <em>{formatCompactBRL(remaining)}</em>
              {contractsGoalGap != null && <> e <em>{contractsGoalGap} {contractsGoalGap === 1 ? 'contrato' : 'contratos'}</em></>}<br />
              <span className="pktb2b-meta-card__lead-time">a meta do ano não foi batida.</span>
            </>
          ) : (
            <>
              Faltam <em>{formatCompactBRL(remaining)}</em>
              {contractsGoalGap != null && <> e <em>{contractsGoalGap} {contractsGoalGap === 1 ? 'contrato' : 'contratos'}</em></>}<br />
              <span className="pktb2b-meta-card__lead-time">para bater a meta do ano.</span>
            </>
          )}
        </h2>
        <div className="pktb2b-meta-card__pct">
          <div className="pktb2b-meta-card__pct-num">{ganhoPctRound}<sup>%</sup></div>
          <div className="pktb2b-meta-card__pct-label">da meta atingida</div>
        </div>
      </div>

      <div>
        <div className="pktb2b-meta-card__bar">
          <div className="pktb2b-meta-card__layer pktb2b-meta-card__layer--ganho" style={{ width: `${ganhoPct}%` }}></div>
          <div className="pktb2b-meta-card__layer pktb2b-meta-card__layer--forecast" style={{ left: `${ganhoPct}%`, width: `${forecastWidth}%` }}></div>
          <div className="pktb2b-meta-card__meta-mark"></div>
        </div>
        <div className="pktb2b-meta-card__foot">
          <div className="pktb2b-meta-foot-cell">
            <span className="pktb2b-meta-foot-cell__label">Ganho</span>
            <span className="pktb2b-meta-foot-cell__value">{formatCompactBRL(totalWonValue)}</span>
            <span className="pktb2b-meta-foot-cell__sub">{wonCount} {wonCount === 1 ? 'negócio' : 'negócios'} · {ganhoPctRound}% da meta</span>
          </div>
          <div className="pktb2b-meta-foot-cell">
            <span className="pktb2b-meta-foot-cell__label">Forecast projetado</span>
            <span className="pktb2b-meta-foot-cell__value">{formatCompactBRL(forecastValue)}</span>
          </div>
          <div className="pktb2b-meta-foot-cell pktb2b-meta-foot-cell--faltante">
            <span className="pktb2b-meta-foot-cell__label">Faltante p/ meta</span>
            <span className="pktb2b-meta-foot-cell__value">− {formatCompactBRL(remaining)}</span>
          </div>
        </div>
      </div>
    </article>
  )
}
