export function PeriodSelector({ year, yearOptions, onChangeYear }) {
  return (
    <select
      className="pktb2b-period__year"
      value={year}
      onChange={(e) => onChangeYear(Number(e.target.value))}
    >
      {yearOptions.map((y) => (
        <option key={y} value={y}>{y}</option>
      ))}
    </select>
  )
}
