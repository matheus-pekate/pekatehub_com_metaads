import { useCallback, useEffect, useState } from 'react'
import { useMetaAdsData } from '../hooks/useMetaAdsData'
import { useStageScale } from '../hooks/useStageScale'
import { MetaAdsTopbar } from '../components/meta-ads/MetaAdsTopbar'
import { ProgramStrip } from '../components/meta-ads/ProgramStrip'
import { ProgramDetail } from '../components/meta-ads/ProgramDetail'
import { DisclaimerStrip } from '../components/meta-ads/DisclaimerStrip'
import './meta-ads-dash.css'

export function MetaAdsDash() {
  const { data, error, lastUpdated, refresh } = useMetaAdsData()
  const stage = useStageScale()
  const [activeIdx, setActiveIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const [epoch, setEpoch] = useState(0)

  const activeProgram = data[activeIdx]
  const duration = activeProgram?.duration ?? 20000

  const handleManualSelect = useCallback((id) => {
    const idx = data.findIndex((p) => p.id === id)
    if (idx >= 0) {
      setActiveIdx(idx)
      setEpoch((e) => e + 1)
    }
  }, [data])

  useEffect(() => {
    if (paused) return
    const timer = setTimeout(() => {
      setActiveIdx((i) => (i + 1) % data.length)
      setEpoch((e) => e + 1)
    }, duration)
    return () => clearTimeout(timer)
  }, [activeIdx, paused, duration, epoch, data.length])

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
        <ProgramDetail program={activeProgram} />
        <DisclaimerStrip />
      </div>
    </div>
  )
}
