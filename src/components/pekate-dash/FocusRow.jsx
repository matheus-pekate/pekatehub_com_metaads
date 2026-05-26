import { KpiStack } from './KpiStack.jsx'
import { MetaCard } from './MetaCard.jsx'
import { TeamCard } from './TeamCard.jsx'

export function FocusRow({ program, allSellers }) {
  if (!program) return null
  return (
    <section className="pkt-focus">
      <KpiStack program={program} />
      <MetaCard program={program} />
      <TeamCard program={program} allSellers={allSellers} />
    </section>
  )
}
