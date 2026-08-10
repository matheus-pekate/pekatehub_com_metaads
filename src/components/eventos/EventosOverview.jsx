import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { STATUS_COLORS } from '../../config/eventos'

function OverviewTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null
  const { label, value, pct } = payload[0].payload
  return (
    <div className="pkt-eventos-overview__tooltip">
      <p className="pkt-eventos-overview__tooltip-label">{label}</p>
      <p><strong>{value}</strong> participante{value === 1 ? '' : 's'} · {pct.toFixed(1)}%</p>
    </div>
  )
}

// Só considera quem é novo no CRM (pessoas que só existem por causa do
// evento) — quem já existia antes traz uma bagagem de relacionamento que não
// tem nada a ver com este evento específico, e distorceria a taxa real dele.
export function EventosOverview({ eventos }) {
  const totals = eventos.reduce((acc, e) => {
    const novoCompareceu = e.compareceram?.novo || {}
    const novoNaoCompareceu = e.naoCompareceram?.novo || {}
    acc.naoCompareceram += (novoNaoCompareceu.prospect || 0) + (novoNaoCompareceu.oportunidade || 0) + (novoNaoCompareceu.negocioGanho || 0)
    acc.prospects += novoCompareceu.prospect || 0
    acc.oportunidades += novoCompareceu.oportunidade || 0
    acc.negociosGanhos += novoCompareceu.negocioGanho || 0
    return acc
  }, { prospects: 0, oportunidades: 0, negociosGanhos: 0, naoCompareceram: 0 })

  const { prospects, oportunidades, negociosGanhos, naoCompareceram } = totals
  const total = prospects + oportunidades + negociosGanhos + naoCompareceram
  const pct = (n) => (total > 0 ? (n / total) * 100 : 0)

  const pieData = [
    { key: 'nao_compareceu', label: 'Não compareceram', value: naoCompareceram, pct: pct(naoCompareceram) },
    { key: 'oportunidade', label: 'Negócios em Aberto', value: oportunidades, pct: pct(oportunidades) },
    { key: 'negocio_ganho', label: 'Negócios Ganhos', value: negociosGanhos, pct: pct(negociosGanhos) },
    { key: 'curioso', label: 'Prospects', value: prospects, pct: pct(prospects) },
  ]

  const conversaoAtiva = total > 0 ? ((oportunidades + negociosGanhos) / total) * 100 : 0
  const conversaoGanho = total > 0 ? (negociosGanhos / total) * 100 : 0
  const fechamento = (oportunidades + negociosGanhos) > 0 ? (negociosGanhos / (oportunidades + negociosGanhos)) * 100 : 0

  if (total === 0) {
    return (
      <section className="pkt-eventos-overview">
        <h2 className="pkt-eventos-overview__title">Visão geral</h2>
        <p className="pkt-eventos-empty">Sem dados suficientes ainda.</p>
      </section>
    )
  }

  return (
    <section className="pkt-eventos-overview">
      <h2 className="pkt-eventos-overview__title">Visão geral</h2>
      <p className="pkt-eventos-overview__subtitle">Considera só quem é novo no CRM — o resultado real gerado pelos eventos, sem misturar com contatos que já existiam.</p>
      <div className="pkt-eventos-overview__body">
        <div className="pkt-eventos-overview__chart">
          <div className="pkt-eventos-overview__pie">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={64}
                  outerRadius={100}
                  paddingAngle={2}
                  isAnimationActive={false}
                >
                  {pieData.map((d) => (
                    <Cell key={d.key} fill={STATUS_COLORS[d.key]} />
                  ))}
                </Pie>
                <Tooltip content={<OverviewTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pkt-eventos-overview__pie-center">
              <strong>{total}</strong>
              <span>novos no CRM</span>
            </div>
          </div>
          <div className="pkt-eventos-overview__legend">
            {pieData.map((d) => (
              <div key={d.key} className="pkt-eventos-overview__legend-row">
                <i className="pkt-eventos-overview__legend-swatch" style={{ background: STATUS_COLORS[d.key] }} />
                <span className="pkt-eventos-overview__legend-label">{d.label}</span>
                <span className="pkt-eventos-overview__legend-value">{d.value} ({d.pct.toFixed(1)}%)</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pkt-eventos-overview__stats">
          <div className="pkt-eventos-overview__stat">
            <span className="pkt-eventos-overview__stat-value">{conversaoAtiva.toFixed(1)}%</span>
            <span className="pkt-eventos-overview__stat-label">Taxa de conversão</span>
            <span className="pkt-eventos-overview__stat-hint">novos no CRM que viraram negócio em aberto ou negócio ganho por causa do evento</span>
          </div>
          <div className="pkt-eventos-overview__stat">
            <span className="pkt-eventos-overview__stat-value">{conversaoGanho.toFixed(1)}%</span>
            <span className="pkt-eventos-overview__stat-label">Taxa de fechamento</span>
            <span className="pkt-eventos-overview__stat-hint">novos no CRM que viraram negócio ganho por causa do evento</span>
          </div>
          <div className="pkt-eventos-overview__stat">
            <span className="pkt-eventos-overview__stat-value">{fechamento.toFixed(1)}%</span>
            <span className="pkt-eventos-overview__stat-label">Taxa negócio em aberto → ganho</span>
            <span className="pkt-eventos-overview__stat-hint">de quem teve negócio em aberto ou ganhou, quantos fecharam</span>
          </div>
        </div>
      </div>
    </section>
  )
}
