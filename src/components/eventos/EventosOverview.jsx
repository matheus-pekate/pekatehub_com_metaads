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

export function EventosOverview({ eventos }) {
  const totals = eventos.reduce((acc, e) => {
    acc.total += e.totalParticipantes
    acc.prospects += e.prospects
    acc.convidados += e.convidados
    acc.oportunidades += e.oportunidadesNovas + e.oportunidadesExistentes
    acc.negociosGanhos += e.negociosGanhosNovos + e.negociosGanhosExistentes
    acc.naoCompareceram += e.naoCompareceramTotal
    return acc
  }, { total: 0, prospects: 0, convidados: 0, oportunidades: 0, negociosGanhos: 0, naoCompareceram: 0 })

  const { total, prospects, convidados, oportunidades, negociosGanhos, naoCompareceram } = totals
  const pct = (n) => (total > 0 ? (n / total) * 100 : 0)

  const pieData = [
    { key: 'nao_compareceu', label: 'Não compareceram', value: naoCompareceram, pct: pct(naoCompareceram) },
    { key: 'convidado', label: 'Convidados', value: convidados, pct: pct(convidados) },
    { key: 'oportunidade', label: 'Negócios em Aberto', value: oportunidades, pct: pct(oportunidades) },
    { key: 'negocio_ganho', label: 'Negócios Ganhos', value: negociosGanhos, pct: pct(negociosGanhos) },
    { key: 'curioso', label: 'Prospects', value: prospects, pct: pct(prospects) },
  ]

  const conversaoAtiva = total > 0 ? ((convidados + oportunidades + negociosGanhos) / total) * 100 : 0
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
              <span>participantes</span>
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
            <span className="pkt-eventos-overview__stat-hint">participantes com alguma interação, negócio em aberto ou negócio ganho</span>
          </div>
          <div className="pkt-eventos-overview__stat">
            <span className="pkt-eventos-overview__stat-value">{conversaoGanho.toFixed(1)}%</span>
            <span className="pkt-eventos-overview__stat-label">Taxa de fechamento</span>
            <span className="pkt-eventos-overview__stat-hint">participantes que viraram negócio ganho</span>
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
