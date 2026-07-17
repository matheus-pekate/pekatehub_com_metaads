function deriveBadge(goalPercent, isClosedYear) {
  if (goalPercent >= 100) return { label: 'Meta batida', variant: 'batida' }
  // Ano já encerrado e meta não batida: não tem mais "ritmo" correndo, só o resultado final.
  if (isClosedYear) return { label: 'Meta não batida', variant: 'perdida' }
  if (goalPercent >= 90) return { label: 'Quase lá', variant: 'quase' }
  return { label: 'Em ritmo', variant: 'ativo' }
}

function B2BPulseCard({ program, active, onSelect, isClosedYear }) {
  const { name, pipelineName, goalPercent = 0, totalOpenCount = 0, accentColor } = program
  const pctDisplay = Math.round(goalPercent)
  const badge = deriveBadge(goalPercent, isClosedYear)

  return (
    <article
      className={`pktb2b-pgm${active ? ' pktb2b-pgm--active' : ''}`}
      style={{ '--pgm-accent': accentColor }}
      onClick={onSelect}
    >
      <header className="pktb2b-pgm__head">
        <div className="pktb2b-pgm__head-l">
          <h2 className="pktb2b-pgm__name">{name}</h2>
          {pipelineName && <span className="pktb2b-pgm__pipeline">{pipelineName}</span>}
        </div>
        <span className={`pktb2b-pgm__badge pktb2b-pgm__badge--${badge.variant}`}>{badge.label}</span>
      </header>

      <div className="pktb2b-pgm__hero">
        <div className="pktb2b-pgm__pct">
          {pctDisplay}<sup>%</sup>
        </div>
        <div className="pktb2b-pgm__pct-label">da meta</div>
      </div>

      <div>
        <div className="pktb2b-pgm__bar">
          <div className="pktb2b-pgm__bar-fill" style={{ width: `${Math.min(100, goalPercent)}%` }}></div>
        </div>
        <div className="pktb2b-pgm__foot">
          <strong>{totalOpenCount}</strong> leads no funil
        </div>
      </div>
    </article>
  )
}

export function B2BPulseRow({ programs, activeId, onSelect, isClosedYear }) {
  return (
    <section className="pktb2b-pulse-row">
      {programs.map((program) => (
        <B2BPulseCard
          key={program.id}
          program={program}
          active={program.id === activeId}
          onSelect={() => onSelect?.(program.id)}
          isClosedYear={isClosedYear}
        />
      ))}
    </section>
  )
}
