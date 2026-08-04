import { STATUS_COLORS } from '../../config/eventos'

export function EventStats({
  prospects,
  convidados,
  oportunidadesNovas,
  oportunidadesExistentes,
  negociosGanhosNovos,
  negociosGanhosExistentes,
  naoCompareceram,
}) {
  const oportunidades = oportunidadesNovas + oportunidadesExistentes
  const negociosGanhos = negociosGanhosNovos + negociosGanhosExistentes
  const total = prospects + convidados + oportunidades + negociosGanhos + naoCompareceram

  if (total === 0) {
    return <div className="pkt-eventos-stats pkt-eventos-stats--empty">Sem participantes ainda</div>
  }

  return (
    <div className="pkt-eventos-stats">
      <span className="pkt-eventos-stats__item">
        <i style={{ background: STATUS_COLORS.nao_compareceu }} />
        <strong className="pkt-eventos-stats__count">{naoCompareceram}</strong> {naoCompareceram === 1 ? 'não compareceu' : 'não compareceram'}
      </span>
      <span className="pkt-eventos-stats__item">
        <i style={{ background: STATUS_COLORS.convidado }} />
        <strong className="pkt-eventos-stats__count">{convidados}</strong> convidado{convidados === 1 ? '' : 's'}
      </span>
      <span className="pkt-eventos-stats__item">
        <i style={{ background: STATUS_COLORS.oportunidade }} />
        <strong className="pkt-eventos-stats__count">{oportunidades}</strong> oportunidade{oportunidades === 1 ? '' : 's'} ({oportunidadesNovas} nova{oportunidadesNovas === 1 ? '' : 's'} · {oportunidadesExistentes} já existia{oportunidadesExistentes === 1 ? '' : 'm'})
      </span>
      <span className="pkt-eventos-stats__item">
        <i style={{ background: STATUS_COLORS.negocio_ganho }} />
        <strong className="pkt-eventos-stats__count">{negociosGanhos}</strong> negócio{negociosGanhos === 1 ? '' : 's'} ganho{negociosGanhos === 1 ? '' : 's'} ({negociosGanhosNovos} novo{negociosGanhosNovos === 1 ? '' : 's'} · {negociosGanhosExistentes} já existia{negociosGanhosExistentes === 1 ? '' : 'm'})
      </span>
      <span className="pkt-eventos-stats__item">
        <i style={{ background: STATUS_COLORS.curioso }} />
        <strong className="pkt-eventos-stats__count">{prospects}</strong> prospect{prospects === 1 ? '' : 's'}
      </span>
    </div>
  )
}
