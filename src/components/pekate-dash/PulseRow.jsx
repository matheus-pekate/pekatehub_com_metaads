import { useEffect, useRef } from 'react'

const COLOR_BY_ID = { pos: 'laranja', gecom: 'teal', clevel: 'azul', gef: 'lilas', pdd: 'rosa' }

const TURMA_LABELS = {
  517:'CPS-01',518:'CPS-02',519:'CPS-03',520:'CPS-04',521:'CPS-05',
  522:'CPS-06',523:'CPS-07',524:'CPS-08',525:'CPS-09',526:'CPS-10',
  527:'CPS-11',528:'CPS-12',529:'CPS-13',530:'CPS-14',531:'CPS-15',
  532:'CPS-16',533:'CPS-17',534:'CPS-18',535:'CPS-19',536:'CPS-20',
  537:'ONLINE',540:'PIRA-01',541:'PIRA-02',538:'SOR-01',539:'SOR-02',
  542:'CBV-01',543:'CBV-02',544:'CBV-03',545:'CBV-04',546:'CBV-05',
  547:'ATB-01',548:'ATB-02',549:'ATB-03',550:'ATB-04',551:'ATB-05',
}
const ORDER = ['gecom', 'pos', 'clevel', 'gef', 'pdd']

function daysUntil(dateStr) {
  if (!dateStr) return 0
  const today = new Date()
  const target = new Date(dateStr + 'T00:00:00')
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24))
}

// Encerrado = a data de início da turma já passou — nesse ponto o programa
// para de ser um alvo ativo de venda, então o crachá e a ordem no topo
// devem refletir isso, independente de ter batido meta ou não.
function isEncerrado(program) {
  return daysUntil(program.startDate) < 0
}

function deriveBadge(goalPercent, goal, converted, closed) {
  if (closed) return { label: 'Encerrado', variant: 'encerrado' }
  if (goalPercent >= 100) return { label: 'Meta batida', variant: 'batida' }
  if (goalPercent >= 90) {
    const missing = Math.max(0, goal - converted)
    return { label: `Quase lá · falta ${missing}`, variant: 'quase' }
  }
  return { label: 'Em ritmo', variant: 'ativo' }
}

function PulseCard({ program, color, active, onSelect }) {
  const { shortName, name, converted, dynamicGoal, totalActive, startDate, convertedFilter, pipelineName } = program
  const turmaLabel = convertedFilter ? TURMA_LABELS[convertedFilter.value] : null
  const rawPct = dynamicGoal > 0 ? (converted / dynamicGoal) * 100 : 0
  const overflow = rawPct > 100
  const fillPct = overflow ? 100 : rawPct
  const pctDisplay = Math.min(100, Math.round(rawPct))
  const days = daysUntil(startDate)
  const closed = days < 0
  const badge = deriveBadge(rawPct, dynamicGoal, converted, closed)

  return (
    <article className={`pkt-pgm${active ? ' pkt-pgm--active' : ''}`} data-color={color} data-pgm-id={program.id} onClick={onSelect} style={{ cursor: 'pointer' }}>
      <header className="pkt-pgm__head">
        <div className="pkt-pgm__head-l">
          <div className="pkt-pgm__tag">{shortName}</div>
          <h2 className="pkt-pgm__name">{name}</h2>
          {(pipelineName || turmaLabel) && (
            <div className="pkt-pgm__source">
              {pipelineName && <span className="pkt-pgm__pipeline">{pipelineName}</span>}
              {pipelineName && turmaLabel && <span className="pkt-pgm__source-sep">/</span>}
              {turmaLabel && <span className="pkt-pgm__turma">{turmaLabel}</span>}
            </div>
          )}
        </div>
        <span className={`pkt-pgm__badge pkt-pgm__badge--${badge.variant}`}>{badge.label}</span>
      </header>

      <div className="pkt-pgm__hero">
        <div className="pkt-pgm__pct">
          {pctDisplay}<sup>%</sup>
        </div>
        <div className="pkt-pgm__count">
          <div className="pkt-pgm__count-num">{converted}<small> / {dynamicGoal}</small></div>
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
            {closed ? 'Encerrado' : (<><strong>{days}</strong> dias p/ a virada</>)}
          </span>
        </div>
      </div>
    </article>
  )
}

export function PulseRow({ programs, activeId = 'pos', onSelect }) {
  const rowRef = useRef(null)

  const ordered = ORDER
    .map((id) => programs.find((p) => p.id === id))
    .filter(Boolean)
    // Programas encerrados (turma já começou) vão pro final da fila — sort é
    // estável, então quem continua ativo mantém a ordem original entre si.
    .sort((a, b) => (isEncerrado(a) ? 1 : 0) - (isEncerrado(b) ? 1 : 0))

  useEffect(() => {
    const row = rowRef.current
    if (!row) return
    const card = row.querySelector(`[data-pgm-id="${activeId}"]`)
    if (!card) return
    const target = Math.max(0, card.offsetLeft - (row.clientWidth - card.offsetWidth) / 2)
    const start = row.scrollLeft
    const distance = target - start
    if (Math.abs(distance) < 1) return
    const duration = 500
    const t0 = performance.now()
    function step(now) {
      const t = Math.min(1, (now - t0) / duration)
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      row.scrollLeft = start + distance * ease
      if (t < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [activeId])

  return (
    <section className="pkt-pulse-row" ref={rowRef}>
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
