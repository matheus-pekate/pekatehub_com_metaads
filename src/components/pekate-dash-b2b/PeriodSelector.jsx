const HALVES = [
  { id: 'S1', label: '1º Sem.' },
  { id: 'S2', label: '2º Sem.' },
  { id: 'ANO', label: 'Ano inteiro' },
]

export function PeriodSelector({ year, half, yearOptions, onChangeYear, onChangeHalf }) {
  return (
    <div className="pktb2b-period">
      <div className="pktb2b-period__segmented">
        {HALVES.map((h) => (
          <button
            key={h.id}
            className={`pktb2b-period__seg${half === h.id ? ' pktb2b-period__seg--active' : ''}`}
            onClick={() => onChangeHalf(h.id)}
          >
            {h.label}
          </button>
        ))}
      </div>
      <select
        className="pktb2b-period__year"
        value={year}
        onChange={(e) => onChangeYear(Number(e.target.value))}
      >
        {yearOptions.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  )
}
