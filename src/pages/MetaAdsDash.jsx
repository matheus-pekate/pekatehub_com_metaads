import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMetaAdsData } from '../hooks/useMetaAdsData'
import { splitByActiveCampaign, nextInRotation } from '../lib/tvPrograms'
import { useStageScale } from '../hooks/useStageScale'
import { MetaAdsTopbar } from '../components/meta-ads/MetaAdsTopbar'
import { ProgramStrip } from '../components/meta-ads/ProgramStrip'
import { ProgramDetail } from '../components/meta-ads/ProgramDetail'
import { AdDetailModal } from '../components/meta-ads/AdDetailModal'
import { WonDealsModal } from '../components/meta-ads/WonDealsModal'
import { LostDealsModal } from '../components/meta-ads/LostDealsModal'
import { OpenDealsModal } from '../components/meta-ads/OpenDealsModal'
import { InvestidoRetornoModal } from '../components/meta-ads/InvestidoRetornoModal'
import { LeadsListModal } from '../components/meta-ads/LeadsListModal'
import './meta-ads-dash.css'

export function MetaAdsDash() {
  const meta = useMetaAdsData()
  return <ComandoMarketing meta={meta} />
}

// `meta` = retorno de useMetaAdsData. `tv` (opcional) = { programIds, onCycleEnd }:
// no Modo TV só passam os programas de programIds e, ao completar a volta,
// avisa a TV em vez de recomeçar.
export function ComandoMarketing({ meta, tv }) {
  const { data, error, lastUpdated, refresh } = meta
  const stage = useStageScale()
  const [activeId, setActiveId] = useState(null)
  const [paused, setPaused] = useState(false)
  const [epoch, setEpoch] = useState(0)
  const [selectedAd, setSelectedAd] = useState(null)
  const [wonDealsProgram, setWonDealsProgram] = useState(null)
  const [lostDealsProgram, setLostDealsProgram] = useState(null)
  const [openDealsProgram, setOpenDealsProgram] = useState(null)
  const [investidoRetornoProgram, setInvestidoRetornoProgram] = useState(null)
  const [leadsListState, setLeadsListState] = useState(null)

  // Programas sem campanha ativa vão pro fim da faixa e ficam fora da rotação
  // automática (continuam clicáveis). Na TV, só os programas da lista da TV.
  const { ordered, rotationIds } = useMemo(() => {
    if (tv) {
      const byId = new Map(data.map((p) => [p.id, p]))
      const list = tv.programIds.map((id) => byId.get(id)).filter(Boolean)
      return { ordered: list, rotationIds: list.map((p) => p.id) }
    }
    return splitByActiveCampaign(data)
  }, [data, tv])

  // O estado segue o id (não o índice): quando o refresh reordena a lista, a
  // tela continua no mesmo programa.
  const activeProgram = ordered.find((p) => p.id === activeId) ?? ordered[0]
  const activeProgramId = activeProgram?.id
  const duration = activeProgram?.duration ?? 20000
  // Programa inativo aberto por clique manual: a rotação para nele.
  const inRotation = !!activeProgram && rotationIds.includes(activeProgram.id)

  const handleManualSelect = useCallback((id) => {
    setActiveId(id)
    setEpoch((e) => e + 1)
  }, [])

  const handleSelectAd = useCallback((ad) => {
    setSelectedAd(ad)
    setPaused(true)
  }, [])

  const handleOpenWonDeals = useCallback((program) => {
    setWonDealsProgram(program)
    setPaused(true)
  }, [])

  const handleOpenLostDeals = useCallback((program) => {
    setLostDealsProgram(program)
    setPaused(true)
  }, [])

  const handleOpenOpenDeals = useCallback((program) => {
    setOpenDealsProgram(program)
    setPaused(true)
  }, [])

  const handleOpenInvestidoRetorno = useCallback((program) => {
    setInvestidoRetornoProgram(program)
    setPaused(true)
  }, [])

  const handleOpenLeadsList = useCallback((program, filterMode) => {
    setLeadsListState({ program, filterMode })
    setPaused(true)
  }, [])

  const modalOpen = !!(selectedAd || wonDealsProgram || lostDealsProgram || openDealsProgram || investidoRetornoProgram || leadsListState)

  useEffect(() => {
    if (paused || modalOpen || !inRotation) return
    const timer = setTimeout(() => {
      const next = nextInRotation(rotationIds, activeProgramId)
      if (next.wrapped && tv) {
        tv.onCycleEnd()
        return
      }
      setActiveId(next.id)
      setEpoch((e) => e + 1)
    }, duration)
    return () => clearTimeout(timer)
  }, [activeProgramId, paused, modalOpen, inRotation, rotationIds, tv, duration, epoch])

  return (
    <div className="pkt-letterbox">
      <div className="pkt-stage pkt-meta-stage" ref={stage} style={{ '--pgm-accent': activeProgram?.accentColor }}>
        <MetaAdsTopbar
          lastUpdated={lastUpdated}
          error={error}
          onRefresh={refresh}
          paused={paused}
          onTogglePause={() => setPaused((p) => !p)}
        />
        <div className="pkt-meta-progress">
          <div
            key={`${activeProgramId}-${epoch}`}
            className="pkt-meta-progress__fill"
            style={{
              animationDuration: `${duration}ms`,
              animationPlayState: paused || !inRotation ? 'paused' : 'running',
            }}
          />
        </div>
        <ProgramStrip programs={ordered} activeId={activeProgram?.id} onSelect={handleManualSelect} />
        <ProgramDetail program={activeProgram} onSelectAd={handleSelectAd} onOpenWonDeals={handleOpenWonDeals} onOpenLostDeals={handleOpenLostDeals} onOpenOpenDeals={handleOpenOpenDeals} onOpenInvestidoRetorno={handleOpenInvestidoRetorno} onOpenLeadsList={handleOpenLeadsList} />
        {selectedAd && (
          <AdDetailModal
            ad={selectedAd}
            accentColor={activeProgram?.accentColor}
            onClose={() => setSelectedAd(null)}
          />
        )}
        {wonDealsProgram && (
          <WonDealsModal
            program={wonDealsProgram}
            onClose={() => setWonDealsProgram(null)}
          />
        )}
        {lostDealsProgram && (
          <LostDealsModal
            program={lostDealsProgram}
            onClose={() => setLostDealsProgram(null)}
          />
        )}
        {openDealsProgram && (
          <OpenDealsModal
            program={openDealsProgram}
            onClose={() => setOpenDealsProgram(null)}
          />
        )}
        {investidoRetornoProgram && (
          <InvestidoRetornoModal
            program={investidoRetornoProgram}
            onClose={() => setInvestidoRetornoProgram(null)}
          />
        )}
        {leadsListState && (
          <LeadsListModal
            program={leadsListState.program}
            initialFilter={leadsListState.filterMode}
            onClose={() => setLeadsListState(null)}
          />
        )}
      </div>
    </div>
  )
}
