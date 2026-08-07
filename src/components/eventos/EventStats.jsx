import { useState } from 'react'
import { STATUS_COLORS, EXISTENTE_CATEGORIES, NOVO_CATEGORIES } from '../../config/eventos'

const EXISTENTE_BUCKET_KEY = {
  sem_interacao: 'semInteracao',
  sem_negociacao: 'semNegociacao',
  oportunidade: 'oportunidade',
  negociacao_perdida: 'negociacaoPerdida',
  negociacao_ganha: 'negociacaoGanha',
}

const NOVO_BUCKET_KEY = {
  prospect: 'prospect',
  oportunidade: 'oportunidade',
  negocio_ganho: 'negocioGanho',
}

function somaExistente(bucket) {
  if (!bucket) return 0
  return (bucket.semInteracao || 0) + (bucket.semNegociacao || 0) + (bucket.oportunidade || 0) + (bucket.negociacaoPerdida || 0) + (bucket.negociacaoGanha || 0)
}

function somaNovo(bucket) {
  if (!bucket) return 0
  return (bucket.prospect || 0) + (bucket.oportunidade || 0) + (bucket.negocioGanho || 0)
}

export function EventStats({ compareceram, naoCompareceram, onDrillDown }) {
  const [aberto, setAberto] = useState(null) // 'compareceram' | 'naoCompareceram' | null
  const [situacao, setSituacao] = useState(null) // 'existente' | 'novo' | null

  const total = (compareceram?.total || 0) + (naoCompareceram?.total || 0)
  if (total === 0) {
    return <div className="pkt-eventos-stats pkt-eventos-stats--empty">Sem participantes ainda</div>
  }

  const buckets = { compareceram, naoCompareceram }

  // Compareceram/Não compareceram → Existe/Novo no CRM → categoria final.
  // Só a categoria final abre a lista de participantes.
  function abrirTop(chave) {
    setSituacao(null)
    setAberto((atual) => (atual === chave ? null : chave))
  }

  function abrirSituacao(chave) {
    setSituacao((atual) => (atual === chave ? null : chave))
  }

  function escolherCategoria(categoria) {
    onDrillDown({
      compareceu: aberto === 'compareceram',
      situacao,
      status: categoria.status,
      dealStatus: categoria.dealStatus,
    })
  }

  const categorias = situacao === 'existente' ? EXISTENTE_CATEGORIES : situacao === 'novo' ? NOVO_CATEGORIES : []
  const bucketKeyMap = situacao === 'existente' ? EXISTENTE_BUCKET_KEY : NOVO_BUCKET_KEY

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
            onClick={() => abrirSituacao('existente')}
          >
            <strong>{somaExistente(buckets[aberto]?.existente)}</strong> já existe no CRM
          </button>
          <button
            type="button"
            className={`pkt-eventos-stats__pill pkt-eventos-stats__pill--sub ${situacao === 'novo' ? 'pkt-eventos-stats__pill--open' : ''}`}
            onClick={() => abrirSituacao('novo')}
          >
            <strong>{somaNovo(buckets[aberto]?.novo)}</strong> novo no CRM
          </button>
        </div>
      )}

      {aberto && situacao && (
        <div className="pkt-eventos-stats__row pkt-eventos-stats__row--categorias">
          {categorias.filter((c) => c.key !== 'todos').map((categoria) => (
            <button
              key={categoria.key}
              type="button"
              className="pkt-eventos-stats__pill pkt-eventos-stats__pill--categoria"
              onClick={() => escolherCategoria(categoria)}
            >
              <i style={{ background: categoria.color }} />
              <strong>{buckets[aberto]?.[situacao]?.[bucketKeyMap[categoria.key]] || 0}</strong> {categoria.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
