const COLOR_BY_ID = { pos: 'laranja', gecom: 'teal', clevel: 'azul', gef: 'lilas' }
const ORDER = ['gecom', 'pos', 'clevel', 'gef']

function daysUntil(dateStr) {
  if (!dateStr) return 0
  const today = new Date()
  const target = new Date(dateStr + 'T00:00:00')
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24))
}

function deriveBadge(goalPercent, goal, converted) {
  if (goalPercent >= 100) return { label: 'Meta batida', variant: 'batida' }
  if (goalPercent >= 90) {
    const missing = Math.max(0, goal - converted)
    return { label: `Quase lá · falta ${missing}`, variant: 'quase' }
  }
  return { label: 'Em ritmo', variant: 'ativo' }
}

function PulseCard({ program, color, active, onSelect }) {
  const { shortName, name, converted, goal, totalActive, startDate } = program
  const rawPct = goal > 0 ? (converted / goal) * 100 : 0
  const overflow = rawPct > 100
  const fillPct = overflow ? 100 : rawPct
  const pctDisplay = Math.min(100, Math.round(rawPct))
  const badge = deriveBadge(rawPct, goal, converted)
  const days = daysUntil(startDate)

  return (
    <article className={`pkt-pgm${active ? ' pkt-pgm--active' : ''}`} data-color={color} onClick={onSelect} style={{ cursor: 'pointer' }}>
      <header className="pkt-pgm__head">
        <div className="pkt-pgm__head-l">
          <div className="pkt-pgm__tag">{shortName}</div>
          <h2 className="pkt-pgm__name">{name}</h2>
        </div>
        <span className={`pkt-pgm__badge pkt-pgm__badge--${badge.variant}`}>{badge.label}</span>
      </header>

      <div className="pkt-pgm__hero">
        <div className="pkt-pgm__pct">
          {pctDisplay}<sup>%</sup>
        </div>
        <div className="pkt-pgm__count">
          <div className="pkt-pgm__count-num">{converted}<small> / {goal}</small></div>
          <div className="pkt-pgm__count-label">Convertidos</div>
        </div>
      </div>

      <div>
        <div className="pkt-pgm__bar">
          <div className="pkt-pgm__bar-fill" style={{ width: `${fillPct}%` }}></div>
          {overflow && <div className="pkt-pgm__bar-overflow"></div>}
        </div>
        <div className="pkt-pgm__foot">
          <span className="pkt-pgm__foot-funil">
            <i className="pkt-arrow"></i> <strong>{totalActive}</strong> leads no funil
          </span>
          <span className="pkt-pgm__foot-dias">
            <strong>{Math.max(0, days)}</strong> dias p/ a virada
          </span>
        </div>
      </div>
    </article>
  )
}

export function PulseRow({ programs, activeId = 'pos', onSelect }) {
  const ordered = ORDER
    .map((id) => programs.find((p) => p.id === id))
    .filter(Boolean)

  return (
    <section className="pkt-pulse-row">
      {ordered.map((program) => (
        <PulseCard
          key={program.id}
          program={program}
          color={COLOR_BY_ID[program.id]}
          active={program.id === activeId}
          onSelect={() => onSelect?.(program.id)}
        />
      ))}
    </section>
  )
}
