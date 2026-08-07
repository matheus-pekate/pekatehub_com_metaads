import { useState } from 'react'
import { STATUS_COLORS, STATUS_LABELS } from '../../config/eventos'

const CATEGORIAS = [
  { bucketKey: 'convidado', status: 'convidado' },
  { bucketKey: 'oportunidade', status: 'oportunidade' },
  { bucketKey: 'negocioGanho', status: 'negocio_ganho' },
  { bucketKey: 'prospect', status: 'curioso' },
]

function somaBucket(bucket) {
  if (!bucket) return 0
  return (bucket.prospect || 0) + (bucket.convidado || 0) + (bucket.oportunidade || 0) + (bucket.negocioGanho || 0)
}

export function EventStats({ compareceram, naoCompareceram, onDrillDown }) {
  const [aberto, setAberto] = useState(null) // 'compareceram' | 'naoCompareceram' | null
  const [situacao, setSituacao] = useState(null) // 'existente' | null

  const total = (compareceram?.total || 0) + (naoCompareceram?.total || 0)
  if (total === 0) {
    return <div className="pkt-eventos-stats pkt-eventos-stats--empty">Sem participantes ainda</div>
  }

  const buckets = { compareceram, naoCompareceram }

  function toggleTop(chave) {
    setSituacao(null)
    setAberto((atual) => (atual === chave ? null : chave))
  }

  function escolherSituacao(chave) {
    if (chave === 'novo') {
      onDrillDown({ compareceu: aberto === 'compareceram', situacao: 'novo', status: 'curioso' })
      return
    }
    setSituacao((atual) => (atual === 'existente' ? null : 'existente'))
  }

  function escolherCategoria(status) {
    onDrillDown({ compareceu: aberto === 'compareceram', situacao: 'existente', status })
  }

  return (
    <div className="pkt-eventos-stats">
      <div className="pkt-eventos-stats__row">
        <button
          type="button"
          className={`pkt-eventos-stats__pill ${aberto === 'compareceram' ? 'pkt-eventos-stats__pill--open' : ''}`}
          onClick={() => toggleTop('compareceram')}
        >
          <strong>{compareceram?.total || 0}</strong> compareceram
        </button>
        <button
          type="button"
          className={`pkt-eventos-stats__pill ${aberto === 'naoCompareceram' ? 'pkt-eventos-stats__pill--open' : ''}`}
          onClick={() => toggleTop('naoCompareceram')}
        >
          <i style={{ background: STATUS_COLORS.nao_compareceu }} />
          <strong>{naoCompareceram?.total || 0}</strong> não compareceram
        </button>
      </div>

      {aberto && (
        <div className="pkt-eventos-stats__row pkt-eventos-stats__row--sub">
          <button
            type="button"
            className={`pkt-eventos-stats__pill pkt-eventos-stats__pill--sub ${situacao === 'existente' ? 'pkt-eventos-stats__pill--open' : ''}`}
            onClick={() => escolherSituacao('existente')}
          >
            <strong>{somaBucket(buckets[aberto]?.existente)}</strong> já existe no CRM
          </button>
          <button
            type="button"
            className="pkt-eventos-stats__pill pkt-eventos-stats__pill--sub"
            onClick={() => escolherSituacao('novo')}
          >
            <strong>{somaBucket(buckets[aberto]?.novo)}</strong> novo no CRM
          </button>
        </div>
      )}

      {aberto && situacao === 'existente' && (
        <div className="pkt-eventos-stats__row pkt-eventos-stats__row--categorias">
          {CATEGORIAS.map(({ bucketKey, status }) => (
            <button
              key={status}
              type="button"
              className="pkt-eventos-stats__pill pkt-eventos-stats__pill--categoria"
              onClick={() => escolherCategoria(status)}
            >
              <i style={{ background: STATUS_COLORS[status] }} />
              <strong>{buckets[aberto]?.existente?.[bucketKey] || 0}</strong> {STATUS_LABELS[status]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
