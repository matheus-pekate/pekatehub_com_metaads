import { Fragment } from 'react'
import { formatCompactBRL } from '../pekate-dash/format.js'

export function B2BFunnelRow({ program }) {
  if (!program) return null

  const { name, stagesData = [], totalOpenCount = 0 } = program
  if (stagesData.length === 0) return null

  const lastIdx = stagesData.length - 1

  return (
    <section className="pktb2b-funnel">
      <header className="pktb2b-funnel__head">
        <span className="pktb2b-funnel__eyebrow">
          Distribuição do funil · <strong>{name}</strong>
        </span>
        <span className="pktb2b-funnel__meta">
          <strong>{totalOpenCount}</strong> ativos
        </span>
      </header>

      <div className="pktb2b-funnel__cards">
        {stagesData.map((stage, i) => (
          <Fragment key={stage.id}>
            {i > 0 && (
              <span className="pktb2b-funnel__sep" aria-hidden="true">→</span>
            )}
            <article className={`pktb2b-funcard${i === lastIdx ? ' pktb2b-funcard--final' : ''}`}>
              <span className="pktb2b-funcard__tag">{stage.name}</span>
              <div className="pktb2b-funcard__body">
                <span className="pktb2b-funcard__count">{stage.count}</span>
                <span className="pktb2b-funcard__value">{formatCompactBRL(stage.value)}</span>
              </div>
            </article>
          </Fragment>
        ))}
      </div>
    </section>
  )
}
