import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Cell } from 'recharts'
import { useAdDailyBreakdown } from '../../hooks/useAdDailyBreakdown'
import { formatBRL, formatCompactNumber } from './format'

function formatDayLabel(dateStr) {
  if (!dateStr) return ''
  const [, month, day] = dateStr.split('-')
  return `${day}/${month}`
}

function AdDetailTooltip({ active, payload, label }) {
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

export function AdDetailModal({ ad, accentColor, onClose }) {
  const { days, loading, error } = useAdDailyBreakdown(ad?.ad_id)
  if (!ad) return null

  const chartData = days.map((d) => ({ ...d, label: formatDayLabel(d.date) }))

  return (
    <div className="pkt-ad-detail-overlay" onClick={onClose}>
      <div className="pkt-ad-detail" onClick={(e) => e.stopPropagation()}>
        <button className="pkt-ad-detail__close" onClick={onClose}>✕</button>
        <div className="pkt-ad-detail__header">
          {ad.thumbnail_url && <img className="pkt-ad-detail__thumb" src={ad.thumbnail_url} alt="" />}
          <div>
            <h3 className="pkt-ad-detail__title">{ad.ad_name}</h3>
            <span className="pkt-ad-detail__subtitle">Performance diária · últimos 7 dias</span>
          </div>
        </div>
        <div className="pkt-ad-detail__legend">
          <span><i className="pkt-ad-detail__legend-swatch" style={{ background: accentColor || '#08373f' }} /> Leads/dia</span>
          <span><i className="pkt-ad-detail__legend-swatch pkt-ad-detail__legend-swatch--line" /> CPL/dia</span>
        </div>
        <div className="pkt-ad-detail__body">
          {loading && <div className="pkt-ad-detail__state">Carregando…</div>}
          {!loading && error && (
            <div className="pkt-ad-detail__state pkt-ad-detail__state--error">Não foi possível carregar o histórico deste anúncio.</div>
          )}
          {!loading && !error && chartData.length === 0 && (
            <div className="pkt-ad-detail__state">Sem dados nos últimos 7 dias para este anúncio.</div>
          )}
          {!loading && !error && chartData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgba(48,50,51,0.5)', fontSize: 12, fontFamily: 'Lato' }}
                />
                <YAxis
                  yAxisId="leads"
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  tick={{ fill: 'rgba(48,50,51,0.35)', fontSize: 11, fontFamily: 'Lato' }}
                />
                <YAxis
                  yAxisId="cpl"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgba(48,50,51,0.35)', fontSize: 11, fontFamily: 'Lato' }}
                  tickFormatter={(v) => formatBRL(v)}
                />
                <Tooltip content={<AdDetailTooltip />} cursor={{ fill: 'rgba(8,55,63,0.05)' }} />
                <Bar yAxisId="leads" dataKey="leads" radius={[4, 4, 0, 0]} barSize={36} isAnimationActive={false}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={accentColor || '#08373f'} />
                  ))}
                </Bar>
                <Line
                  yAxisId="cpl"
                  dataKey="cpl"
                  stroke="#052a30"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#ffffff', stroke: '#052a30', strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: '#052a30' }}
                  connectNulls
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
