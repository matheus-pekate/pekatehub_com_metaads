export function DayAxisTick({ x, y, payload, weekdayMap }) {
  const weekday = weekdayMap?.[payload.value] || ''
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={12} textAnchor="middle" fontFamily="Lato" fontWeight={800} fontSize={10.5} fill="rgba(var(--t-ink2), 0.7)">
        {payload.value}
      </text>
      <text x={0} y={0} dy={24} textAnchor="middle" fontFamily="Lato" fontWeight={800} fontSize={9.5} fill="rgba(var(--t-ink2), 0.45)">
        {weekday}
      </text>
    </g>
  )
}
