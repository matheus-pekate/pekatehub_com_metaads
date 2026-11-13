import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDashboardData } from '../hooks/useDashboardData.js'
import { useB2BDashboardData } from '../hooks/useB2BDashboardData.js'
import { useMetaAdsData } from '../hooks/useMetaAdsData.js'
import { PROGRAMS } from '../config/pipedrive.js'
import { eligibleB2CIds, eligibleB2BIds, eligibleMarketingIds } from '../lib/tvPrograms.js'
import { ComandoB2C } from './PekateDash.jsx'
import { ComandoB2B } from './PekateB2BDash.jsx'
import { ComandoMarketing } from './MetaAdsDash.jsx'
import './tv-mode.css'

const PHASES = ['b2c', 'b2b', 'marketing']

// Mantém a mesma referência enquanto o conteúdo da lista não muda, pra os
// recarregamentos de dados não reiniciarem o carrossel da fase na tela.
function useStableIds(ids) {
  const key = ids.join(',')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => ids, [key])
}

// Modo TV: roda B2C → B2B → Marketing em loop, só com o que está acontecendo.
// Os dados são buscados uma vez aqui; cada tela avisa (onCycleEnd) quando
// completa a volta do seu carrossel.
export function TvMode() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState('b2c')
  const year = useMemo(() => new Date().getFullYear(), [])
  const dashboard = useDashboardData()
  const b2b = useB2BDashboardData(year)
  const meta = useMetaAdsData()

  // B2C: turmas que ainda não começaram. A data é reavaliada a cada troca de fase,
  // pra TV ligada por dias seguidos não ficar com a lista velha.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const b2cIds = useStableIds(useMemo(() => eligibleB2CIds(PROGRAMS, new Date()), [phase]))
  const b2bIds = useStableIds(eligibleB2BIds(b2b.data?.programs ?? []))
  const marketingIds = useStableIds(eligibleMarketingIds(meta.data))

  const info = {
    b2c: { ready: true, ids: b2cIds },
    b2b: { ready: !b2b.loading, ids: b2bIds },
    marketing: { ready: !meta.loading, ids: marketingIds },
  }
  const nothingToShow = PHASES.every((p) => info[p].ready && info[p].ids.length === 0)

  const advance = useCallback(() => {
    setPhase((p) => PHASES[(PHASES.indexOf(p) + 1) % PHASES.length])
  }, [])

  // Fase já carregada e sem nada em andamento: pula. Ainda carregando: espera.
  const current = info[phase]
  useEffect(() => {
    if (!nothingToShow && current.ready && current.ids.length === 0) advance()
  }, [phase, nothingToShow, current.ready, current.ids.length, advance])

  const tv = useMemo(
    () => ({ programIds: info[phase].ids, onCycleEnd: advance }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [phase, b2cIds, b2bIds, marketingIds, advance],
  )

  if (nothingToShow) {
    return (
      <div className="tv-empty">
        <img src="/pekate-logo.png" alt="Pekatê" className="tv-empty__logo" />
        <h1 className="tv-empty__title">Modo <em>TV</em></h1>
        <p className="tv-empty__text">Nenhum programa em andamento para exibir na TV.</p>
        <button className="tv-empty__btn" onClick={() => navigate('/pkt-hub')}>Voltar ao PKT-HUB</button>
      </div>
    )
  }

  // Fase sem programas (ainda carregando ou prestes a ser pulada): tela neutra, nunca a fase vazia.
  if (current.ids.length === 0) return <div className="tv-loading" aria-busy="true" />

  if (phase === 'b2c') return <ComandoB2C key="b2c" dashboard={dashboard} tv={tv} />
  if (phase === 'b2b') return <ComandoB2B key="b2b" year={year} b2b={b2b} tv={tv} />
  return <ComandoMarketing key="marketing" meta={meta} tv={tv} />
}
