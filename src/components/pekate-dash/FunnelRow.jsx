import { Fragment, useEffect, useRef } from 'react'
import { formatCompactBRL } from './format.js'

function isPast(dateStr) {
  if (!dateStr) return false
  return new Date() >= new Date(dateStr + 'T00:00:00')
}

/* ── Confete canvas ── */
function Confetti() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const COLORS = ['#fe8f20','#08373f','#2DA8A8','#f5c842','#e84393','#ffffff','#7B61FF']
    const COUNT = 180
    const pieces = Array.from({ length: COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      w: Math.random() * 10 + 5,
      h: Math.random() * 6 + 3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.15,
      vx: (Math.random() - 0.5) * 2,
      vy: Math.random() * 3 + 2,
    }))

    let frame
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      pieces.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        p.rot += p.rotSpeed
        if (p.y > canvas.height) {
          p.y = -10
          p.x = Math.random() * canvas.width
        }
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.restore()
      })
      frame = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(frame)
  }, [])

  return <canvas ref={canvasRef} className="pkt-funnel__confetti" />
}

/* ── Banner de encerramento ── */
function ClosedBanner({ program }) {
  const { shortName, converted, goal } = program
  const batida = converted >= goal

  return (
    <div className={`pkt-funnel__closed pkt-funnel__closed--${batida ? 'batida' : 'miss'}`}>
      {batida && <Confetti />}
      <div className="pkt-funnel__closed-content">
        {batida ? (
          <>
            <span className="pkt-funnel__closed-emoji">🎉</span>
            <p className="pkt-funnel__closed-msg">
              <strong>{shortName}</strong> chegou — meta batida!
            </p>
            <span className="pkt-funnel__closed-counter">{converted} / {goal} alunos convertidos</span>
          </>
        ) : (
          <>
            <span className="pkt-funnel__closed-emoji">📋</span>
            <p className="pkt-funnel__closed-msg">
              <strong>{shortName}</strong> encerrado — meta não atingida.
            </p>
            <span className="pkt-funnel__closed-counter">{converted} de {goal} alunos convertidos</span>
          </>
        )}
      </div>
    </div>
  )
}

export function FunnelRow({ program }) {
  if (!program) return null

  const { shortName, stagesData = [], converted = 0, totalActive = 0, price = 0, startDate } = program
  if (stagesData.length === 0) return null

  const ended = isPast(startDate)

  if (ended) {
    return (
      <section className="pkt-funnel">
        <ClosedBanner program={program} />
      </section>
    )
  }

  const lastIdx = stagesData.length - 1
  const stages = stagesData
  const firstCount = stages[0]?.count ?? 0
  const lastCount = stages[lastIdx]?.count ?? 0

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
