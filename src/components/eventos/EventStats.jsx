import { useState } from 'react'
import { STATUS_COLORS, getStatusLabel } from '../../config/eventos'

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

  // Cada nível, além de abrir o próximo, já mostra a lista filtrada até aqui —
  // clicar em qualquer pill sempre leva a algum resultado visível.
  function abrirTop(chave) {
    setSituacao(null)
    setAberto(chave)
    onDrillDown({ compareceu: chave === 'compareceram', situacao: 'todos', status: 'todos' })
  }

  function escolherSituacao(chave) {
    setSituacao(chave === 'existente' ? 'existente' : null)
    onDrillDown({
      compareceu: aberto === 'compareceram',
      situacao: chave,
      status: chave === 'novo' ? 'curioso' : 'todos',
    })
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
          onClick={() => abrirTop('compareceram')}
        >
          <strong>{compareceram?.total || 0}</strong> compareceram
        </button>
        <button
          type="button"
          className={`pkt-eventos-stats__pill ${aberto === 'naoCompareceram' ? 'pkt-eventos-stats__pill--open' : ''}`}
          onClick={() => abrirTop('naoCompareceram')}
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
            {/* mostra só os prospects — quem é novo no CRM mas já avançou (virou
                convidado/oportunidade/negócio ganho novo) não entra nessa contagem específica */}
            <strong>{buckets[aberto]?.novo?.prospect || 0}</strong> novo no CRM
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
              <strong>{buckets[aberto]?.existente?.[bucketKey] || 0}</strong> {getStatusLabel(status, 'existente')}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
