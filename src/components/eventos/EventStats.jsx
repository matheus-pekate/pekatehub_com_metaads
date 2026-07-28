import { STATUS_COLORS } from '../../config/eventos'

export function EventStats({ prospects, leadsNovos, leadsExistentes, negociosNovos, negociosExistentes, naoCompareceram }) {
  const leads = leadsNovos + leadsExistentes
  const negocios = negociosNovos + negociosExistentes
  const total = prospects + leads + negocios + naoCompareceram

  if (total === 0) {
    return <div className="pkt-eventos-stats pkt-eventos-stats--empty">Sem participantes ainda</div>
  }

  return (
    <div className="pkt-eventos-stats">
      <span className="pkt-eventos-stats__item">
        <i style={{ background: STATUS_COLORS.curioso }} />
        {prospects} prospect{prospects === 1 ? '' : 's'}
      </span>
      <span className="pkt-eventos-stats__item">
        <i style={{ background: STATUS_COLORS.lead }} />
        {leads} lead{leads === 1 ? '' : 's'} ({leadsNovos} novo{leadsNovos === 1 ? '' : 's'} · {leadsExistentes} já existia{leadsExistentes === 1 ? '' : 'm'})
      </span>
      <span className="pkt-eventos-stats__item">
        <i style={{ background: STATUS_COLORS.negocio }} />
        {negocios} negócio{negocios === 1 ? '' : 's'} ({negociosNovos} novo{negociosNovos === 1 ? '' : 's'} · {negociosExistentes} já existia{negociosExistentes === 1 ? '' : 'm'})
      </span>
      <span className="pkt-eventos-stats__item">
        <i style={{ background: STATUS_COLORS.nao_compareceu }} />
        {naoCompareceram} não compareceu{naoCompareceram === 1 ? '' : 'ram'}
      </span>
    </div>
  )
}
