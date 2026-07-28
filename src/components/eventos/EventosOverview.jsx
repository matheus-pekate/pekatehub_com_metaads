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
    acc.leads += e.leadsNovos + e.leadsExistentes
    acc.negocios += e.negociosNovos + e.negociosExistentes
    acc.naoCompareceram += e.naoCompareceram
    return acc
  }, { total: 0, prospects: 0, leads: 0, negocios: 0, naoCompareceram: 0 })

  const { total, prospects, leads, negocios, naoCompareceram } = totals
  const pct = (n) => (total > 0 ? (n / total) * 100 : 0)

  const pieData = [
    { key: 'curioso', label: 'Prospects', value: prospects, pct: pct(prospects) },
    { key: 'lead', label: 'Leads', value: leads, pct: pct(leads) },
    { key: 'negocio', label: 'Negócios', value: negocios, pct: pct(negocios) },
    { key: 'nao_compareceu', label: 'Não compareceram', value: naoCompareceram, pct: pct(naoCompareceram) },
  ]

  const conversaoLead = total > 0 ? ((leads + negocios) / total) * 100 : 0
  const conversaoNegocio = total > 0 ? (negocios / total) * 100 : 0
  const fechamento = (leads + negocios) > 0 ? (negocios / (leads + negocios)) * 100 : 0

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
            <span className="pkt-eventos-overview__stat-value">{conversaoLead.toFixed(1)}%</span>
            <span className="pkt-eventos-overview__stat-label">Taxa de conversão em lead</span>
            <span className="pkt-eventos-overview__stat-hint">participantes que viraram lead ou negócio</span>
          </div>
          <div className="pkt-eventos-overview__stat">
            <span className="pkt-eventos-overview__stat-value">{conversaoNegocio.toFixed(1)}%</span>
            <span className="pkt-eventos-overview__stat-label">Taxa de fechamento</span>
            <span className="pkt-eventos-overview__stat-hint">participantes que viraram negócio</span>
          </div>
          <div className="pkt-eventos-overview__stat">
            <span className="pkt-eventos-overview__stat-value">{fechamento.toFixed(1)}%</span>
            <span className="pkt-eventos-overview__stat-label">Taxa lead → negócio</span>
            <span className="pkt-eventos-overview__stat-hint">de quem virou lead ou negócio, quantos fecharam</span>
          </div>
        </div>
      </div>
    </section>
  )
}
