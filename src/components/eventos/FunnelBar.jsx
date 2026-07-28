import { STATUS_COLORS } from '../../config/eventos'

export function FunnelBar({ prospects, leadsNovos, leadsExistentes, negociosNovos, negociosExistentes }) {
  const leads = leadsNovos + leadsExistentes
  const negocios = negociosNovos + negociosExistentes
  const total = prospects + leads + negocios

  if (total === 0) {
    return <div className="pkt-eventos-funnel pkt-eventos-funnel--empty">Sem participantes ainda</div>
  }

  const pct = (n) => `${(n / total) * 100}%`

  return (
    <div className="pkt-eventos-funnel">
      <div className="pkt-eventos-funnel__bar">
        <div className="pkt-eventos-funnel__seg" style={{ width: pct(prospects), background: STATUS_COLORS.curioso }} title={`${prospects} prospects`} />
        <div className="pkt-eventos-funnel__seg" style={{ width: pct(leads), background: STATUS_COLORS.lead }} title={`${leads} leads`} />
        <div className="pkt-eventos-funnel__seg" style={{ width: pct(negocios), background: STATUS_COLORS.negocio }} title={`${negocios} negócios`} />
      </div>
      <div className="pkt-eventos-funnel__legend">
        <span><i style={{ background: STATUS_COLORS.curioso }} />{prospects} prospect{prospects === 1 ? '' : 's'}</span>
        <span><i style={{ background: STATUS_COLORS.lead }} />{leads} lead{leads === 1 ? '' : 's'} ({leadsNovos} novo{leadsNovos === 1 ? '' : 's'} · {leadsExistentes} já existia{leadsExistentes === 1 ? '' : 'm'})</span>
        <span><i style={{ background: STATUS_COLORS.negocio }} />{negocios} negócio{negocios === 1 ? '' : 's'} ({negociosNovos} novo{negociosNovos === 1 ? '' : 's'} · {negociosExistentes} já existia{negociosExistentes === 1 ? '' : 'm'})</span>
      </div>
    </div>
  )
}
