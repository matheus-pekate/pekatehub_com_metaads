import { ProgramCard } from './ProgramCard'

export function ProgramGrid({ programs }) {
  return (
    <div className="pkt-meta-grid">
      {programs.map((program) => (
        <ProgramCard key={program.id} program={program} />
      ))}
    </div>
  )
}
