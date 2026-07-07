import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Cell } from 'recharts'
import { useProgramDailyBreakdown } from '../../hooks/useProgramDailyBreakdown'
import { formatBRL, formatCompactNumber } from './format'

function formatDayLabel(dateStr) {
  if (!dateStr) return ''
  const [, month, day] = dateStr.split('-')
  return `${day}/${month}`
}

function ProgramDailyTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  const leads = payload.find((p) => p.dataKey === 'leads')?.value
  const cpl = payload.find((p) => p.dataKey === 'cpl')?.value
  return (
    <div className="pkt-ad-detail__tooltip">
      <p className="pkt-ad-detail__tooltip-label">{label}</p>
      <p><strong>{formatCompactNumber(leads)}</strong> leads</p>
      <p>CPL: <strong>{formatBRL(cpl)}</strong></p>
    </div>
  )
}

export function ProgramDailyChart({ programId, accentColor }) {
  const { days, loading, error } = useProgramDailyBreakdown(programId)
  const chartData = days.map((d) => ({ ...d, label: formatDayLabel(d.date) }))
  const tickInterval = Math.max(0, Math.ceil(chartData.length / 12) - 1)

  return (
    <div className="pkt-meta-progchart">
      <div className="pkt-meta-progchart__header">
        <span className="pkt-meta-progchart__title">Performance diária · últimos 30 dias (todos os anúncios)</span>
        <div className="pkt-meta-progchart__legend">
          <span><i className="pkt-meta-progchart__swatch" style={{ background: accentColor || '#08373f' }} /> Leads/dia</span>
          <span><i className="pkt-meta-progchart__swatch pkt-meta-progchart__swatch--line" /> CPL/dia</span>
        </div>
      </div>
      <div className="pkt-meta-progchart__body">
        {loading && <div className="pkt-meta-progchart__state">Carregando…</div>}
        {!loading && error && <div className="pkt-meta-progchart__state pkt-meta-progchart__state--error">Não foi possível carregar o histórico.</div>}
        {!loading && !error && chartData.length === 0 && (
          <div className="pkt-meta-progchart__state">Sem dados nos últimos 30 dias.</div>
        )}
        {!loading && !error && chartData.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                interval={tickInterval}
                tick={{ fill: 'rgba(48,50,51,0.5)', fontSize: 10.5, fontFamily: 'Lato' }}
              />
              <YAxis
                yAxisId="leads"
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={26}
                tick={{ fill: 'rgba(48,50,51,0.35)', fontSize: 11, fontFamily: 'Lato' }}
              />
              <YAxis
                yAxisId="cpl"
                orientation="right"
                axisLine={false}
                tickLine={false}
                width={60}
                tick={{ fill: 'rgba(48,50,51,0.35)', fontSize: 11, fontFamily: 'Lato' }}
                tickFormatter={(v) => formatBRL(v)}
              />
              <Tooltip content={<ProgramDailyTooltip />} cursor={{ fill: 'rgba(8,55,63,0.05)' }} />
              <Bar yAxisId="leads" dataKey="leads" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={accentColor || '#08373f'} />
                ))}
              </Bar>
              <Line
                yAxisId="cpl"
                dataKey="cpl"
                stroke="#052a30"
                strokeWidth={2}
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
