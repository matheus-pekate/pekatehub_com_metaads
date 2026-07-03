import { formatBRL } from './format'

function ProgramPill({ program, active, onSelect }) {
  const { name, accentColor, hasActiveCampaigns, totalLeads, cplMedio } = program
  return (
    <article
      className={`pkt-meta-pill ${active ? 'pkt-meta-pill--active' : ''} ${hasActiveCampaigns ? '' : 'pkt-meta-pill--empty'}`}
      style={{ '--pill-accent': accentColor }}
      onClick={onSelect}
    >
      <span className="pkt-meta-pill__name">{name}</span>
      {hasActiveCampaigns ? (
        <div className="pkt-meta-pill__stats">
          <span className="pkt-meta-pill__leads">{totalLeads} <small>leads</small></span>
          <span className="pkt-meta-pill__cpl">{formatBRL(cplMedio)} <small>CPL</small></span>
        </div>
      ) : (
        <span className="pkt-meta-pill__muted">Sem campanha ativa</span>
      )}
    </article>
  )
}

export function ProgramStrip({ programs, activeId, onSelect }) {
  return (
    <section className="pkt-meta-strip">
      {programs.map((program) => (
        <ProgramPill
          key={program.id}
          program={program}
          active={program.id === activeId}
          onSelect={() => onSelect(program.id)}
        />
      ))}
    </section>
  )
}
