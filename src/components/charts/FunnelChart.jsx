import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList, Customized } from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-teal-800 border border-teal-600/40 rounded px-3 py-2 text-sm shadow-xl">
        <p className="text-white/60 text-xs mb-1">{label}</p>
        <p className="text-white font-700 text-base">{payload[0].value} deals</p>
      </div>
    )
  }
  return null
}

function DropAnnotations({ xAxisMap, yAxisMap, data }) {
  const xAxis = xAxisMap?.[0]
  const yAxis = yAxisMap?.[0]
  if (!xAxis || !yAxis || !data) return null

  const bandSize = xAxis.bandSize ?? (xAxis.width / data.length)

  return (
    <g>
      {data.map((entry, i) => {
        if (i === 0) return null
        const prev = data[i - 1]
        if (prev.count === 0) return null

        const drop = Math.round(((prev.count - entry.count) / prev.count) * 100)
        const x = xAxis.x + i * bandSize
        const y = yAxis.y + yAxis.height * 0.22

        const fill = drop > 60
          ? '#f87171'
          : drop > 35
          ? '#fb923c'
          : 'rgba(255,255,255,0.4)'

        return (
          <g key={i}>
            <text
              x={x}
              y={y - 6}
              textAnchor="middle"
              fill={fill}
              fontSize={9}
              fontFamily="Lato"
              fontWeight="700"
            >
              ↓
            </text>
            <text
              x={x}
              y={y + 5}
              textAnchor="middle"
              fill={fill}
              fontSize={9}
              fontFamily="Lato"
              fontWeight="700"
            >
              -{drop}%
            </text>
          </g>
        )
      })}
    </g>
  )
}

export function FunnelChart({ stagesData, winStageId, accentColor }) {
  const chartData = stagesData.map((stage) => ({
    name: stage.name,
    count: stage.count,
    isWin: stage.id === winStageId,
  }))

  return (
    <div className="w-full flex-1 min-h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 24, right: 8, left: -20, bottom: -10 }}
          barCategoryGap="25%"
        >
          <XAxis
            dataKey="name"
            tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10, fontFamily: 'Lato' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontFamily: 'Lato' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="count" radius={[3, 3, 0, 0]}>
            <LabelList
              dataKey="count"
              position="top"
              style={{ fill: 'rgba(255,255,255,0.55)', fontSize: 10, fontFamily: 'Lato' }}
            />
            {chartData.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.isWin ? accentColor : 'rgba(255,255,255,0.12)'}
                opacity={entry.isWin ? 1 : 0.7 + (index / chartData.length) * 0.3}
              />
            ))}
          </Bar>
          <Customized component={(props) => <DropAnnotations {...props} data={chartData} />} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
