import { useCallback, useEffect, useState } from 'react'
import { useMetaAdsData } from '../hooks/useMetaAdsData'
import { useStageScale } from '../hooks/useStageScale'
import { MetaAdsTopbar } from '../components/meta-ads/MetaAdsTopbar'
import { ProgramStrip } from '../components/meta-ads/ProgramStrip'
import { ProgramDetail } from '../components/meta-ads/ProgramDetail'
import { DisclaimerStrip } from '../components/meta-ads/DisclaimerStrip'
import { AdDetailModal } from '../components/meta-ads/AdDetailModal'
import { WonDealsModal } from '../components/meta-ads/WonDealsModal'
import { LostDealsModal } from '../components/meta-ads/LostDealsModal'
import { LeadsListModal } from '../components/meta-ads/LeadsListModal'
import './meta-ads-dash.css'

export function MetaAdsDash() {
  const { data, error, lastUpdated, refresh } = useMetaAdsData()
  const stage = useStageScale()
  const [activeIdx, setActiveIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const [epoch, setEpoch] = useState(0)
  const [selectedAd, setSelectedAd] = useState(null)
  const [wonDealsProgram, setWonDealsProgram] = useState(null)
  const [lostDealsProgram, setLostDealsProgram] = useState(null)
  const [leadsListState, setLeadsListState] = useState(null)

  const activeProgram = data[activeIdx]
  const duration = activeProgram?.duration ?? 20000

  const handleManualSelect = useCallback((id) => {
    const idx = data.findIndex((p) => p.id === id)
    if (idx >= 0) {
      setActiveIdx(idx)
      setEpoch((e) => e + 1)
    }
  }, [data])

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

  const handleOpenLeadsList = useCallback((program, filterMode) => {
    setLeadsListState({ program, filterMode })
    setPaused(true)
  }, [])

  useEffect(() => {
    if (paused || selectedAd || wonDealsProgram || lostDealsProgram || leadsListState) return
    const timer = setTimeout(() => {
      setActiveIdx((i) => (i + 1) % data.length)
      setEpoch((e) => e + 1)
    }, duration)
    return () => clearTimeout(timer)
  }, [activeIdx, paused, selectedAd, wonDealsProgram, lostDealsProgram, leadsListState, duration, epoch, data.length])

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
            key={`${activeIdx}-${epoch}`}
            className="pkt-meta-progress__fill"
            style={{
              animationDuration: `${duration}ms`,
              animationPlayState: paused ? 'paused' : 'running',
            }}
          />
        </div>
        <ProgramStrip programs={data} activeId={activeProgram?.id} onSelect={handleManualSelect} />
        <ProgramDetail program={activeProgram} onSelectAd={handleSelectAd} onOpenWonDeals={handleOpenWonDeals} onOpenLostDeals={handleOpenLostDeals} onOpenLeadsList={handleOpenLeadsList} />
        <DisclaimerStrip />
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
