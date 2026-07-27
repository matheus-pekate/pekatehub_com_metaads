import { STATUS_COLORS } from '../../config/eventos'

export function FunnelBar({ curiosos, leads, negocios }) {
  const total = curiosos + leads + negocios

  if (total === 0) {
    return <div className="pkt-eventos-funnel pkt-eventos-funnel--empty">Sem participantes ainda</div>
  }

  const pct = (n) => `${(n / total) * 100}%`

  return (
    <div className="pkt-eventos-funnel">
      <div className="pkt-eventos-funnel__bar">
        <div className="pkt-eventos-funnel__seg" style={{ width: pct(curiosos), background: STATUS_COLORS.curioso }} title={`${curiosos} curiosos`} />
        <div className="pkt-eventos-funnel__seg" style={{ width: pct(leads), background: STATUS_COLORS.lead }} title={`${leads} leads`} />
        <div className="pkt-eventos-funnel__seg" style={{ width: pct(negocios), background: STATUS_COLORS.negocio }} title={`${negocios} negócios`} />
      </div>
      <div className="pkt-eventos-funnel__legend">
        <span><i style={{ background: STATUS_COLORS.curioso }} />{curiosos} curioso{curiosos === 1 ? '' : 's'}</span>
        <span><i style={{ background: STATUS_COLORS.lead }} />{leads} lead{leads === 1 ? '' : 's'}</span>
        <span><i style={{ background: STATUS_COLORS.negocio }} />{negocios} negócio{negocios === 1 ? '' : 's'}</span>
      </div>
    </div>
  )
}
