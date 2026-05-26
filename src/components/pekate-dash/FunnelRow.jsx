import { Fragment } from 'react'
import { formatCompactBRL } from './format.js'

export function FunnelRow({ program }) {
  if (!program) return null

  const { shortName, stagesData = [], converted = 0, totalActive = 0, price = 0 } = program
  if (stagesData.length === 0) return null

  const lastIdx = stagesData.length - 1
  const stages = stagesData

  const firstCount = stages[0]?.count ?? 0
  const lastCount = stages[lastIdx]?.count ?? 0
  const conversionRate = firstCount > 0 ? (lastCount / firstCount) * 100 : 0

  return (
    <section className="pkt-funnel">
      <header className="pkt-funnel__head">
        <span className="pkt-funnel__eyebrow">
          Distribuição do funil · <strong>{shortName}</strong>
        </span>
        <span className="pkt-funnel__meta">
          <strong>{totalActive}</strong> ativos
        </span>
      </header>

      <div className="pkt-funnel__cards">
        {stages.map((stage, i) => {
          const prev = i > 0 ? stages[i - 1] : null
          const isFinal = i === lastIdx

          let chip = null
          if (prev) {
            const prevCount = prev.count
            const currCount = stage.count
            if (currCount > prevCount) {
              chip = { type: 'up', text: `+${currCount - prevCount}` }
            } else if (prevCount > 0) {
              const pct = Math.round((currCount / prevCount) * 100)
              chip = { type: pct === 100 ? 'up' : 'down', text: `${pct}%` }
            }
          }

          return (
            <Fragment key={stage.id}>
              {i > 0 && (
                <span className="pkt-funnel__sep" aria-hidden="true">→</span>
              )}
              <article className={`pkt-funcard${isFinal ? ' pkt-funcard--final' : ''}`}>
                <span className="pkt-funcard__tag">{stage.name}</span>
                <div className="pkt-funcard__body">
                  <div className="pkt-funcard__body-top">
                    <span className="pkt-funcard__count">{stage.count}</span>
                    {chip && (
                      <span className={`pkt-funcard__chip pkt-funcard__chip--${chip.type}`}>
                        <i className="pkt-arrow"></i> {chip.text}
                      </span>
                    )}
                  </div>
                  <span className="pkt-funcard__value">
                    <span className="pkt-funcard__value-label">Forecast</span>
                    {formatCompactBRL(stage.count * price)}
                  </span>
                </div>
              </article>
            </Fragment>
          )
        })}
      </div>
    </section>
  )
}
