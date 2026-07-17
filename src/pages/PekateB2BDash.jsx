import { useEffect, useState, useCallback } from 'react'
import { useB2BDashboardData } from '../hooks/useB2BDashboardData.js'
import { useStageScale } from '../hooks/useStageScale.js'
import { B2B_YEAR_OPTIONS, PROGRAMS_B2B } from '../config/pipedrive.js'
import { B2BTopbar } from '../components/pekate-dash-b2b/B2BTopbar.jsx'
import { B2BPulseRow } from '../components/pekate-dash-b2b/B2BPulseRow.jsx'
import { B2BKpiStack } from '../components/pekate-dash-b2b/B2BKpiStack.jsx'
import { B2BMetaCard } from '../components/pekate-dash-b2b/B2BMetaCard.jsx'
import { B2BFunnelRow } from '../components/pekate-dash-b2b/B2BFunnelRow.jsx'
import { AlertsStrip } from '../components/pekate-dash/AlertsStrip.jsx'
import { TeamCard } from '../components/pekate-dash/TeamCard.jsx'
import { AlertDealsModal } from '../components/pekate-dash/AlertDealsModal.jsx'
import '../pages/pekate-dash.css'
import './pekate-dash-b2b.css'

const CAROUSEL_DURATION = 20000
const CAROUSEL = PROGRAMS_B2B.map((p) => p.id)

export function PekateB2BDash() {
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [activeIdx, setActiveIdx] = useState(0)
  const [epoch, setEpoch] = useState(0)
  const [paused, setPaused] = useState(false)
  const [activeAlertKey, setActiveAlertKey] = useState(null)
  const { data, lastUpdated } = useB2BDashboardData(year)
  const stageRef = useStageScale()

  const activeId = CAROUSEL[activeIdx]

  const handleManualSelect = useCallback((id) => {
    const idx = CAROUSEL.findIndex((c) => c === id)
    if (idx >= 0) {
      setActiveIdx(idx)
      setEpoch((e) => e + 1)
    }
  }, [])

  useEffect(() => {
    if (paused || activeAlertKey) return
    const timer = setTimeout(() => {
      setActiveIdx((i) => (i + 1) % CAROUSEL.length)
      setEpoch((e) => e + 1)
    }, CAROUSEL_DURATION)
    return () => clearTimeout(timer)
  }, [activeIdx, epoch, paused, activeAlertKey])

  const activeProgram = data?.programs?.find((p) => p.id === activeId)
  const accent = activeProgram?.accentColor || '#08373F'
  const isClosedYear = year < new Date().getFullYear()

  return (
    <div className="pktb2b-letterbox">
      <div className="pktb2b-stage" ref={stageRef}>
        <div className="pktb2b-dash" style={{ '--pgm-accent': accent }}>
          <B2BTopbar
            year={year}
            yearOptions={B2B_YEAR_OPTIONS}
            onChangeYear={setYear}
            paused={paused}
            onTogglePause={() => setPaused((p) => !p)}
          />

          <div className="pkt-progress-bar">
            <div
              key={`${activeIdx}-${epoch}`}
              className="pkt-progress-bar__fill"
              style={{
                animationDuration: `${CAROUSEL_DURATION}ms`,
                animationPlayState: paused ? 'paused' : 'running',
              }}
            />
          </div>

          {data?.programs && (
            <>
              <B2BPulseRow programs={data.programs} activeId={activeId} onSelect={handleManualSelect} isClosedYear={isClosedYear} />
              <AlertsStrip lastUpdated={lastUpdated} program={activeProgram} onSelectAlert={(key) => setActiveAlertKey(key)} />
              <section className="pktb2b-focus">
                <B2BKpiStack program={activeProgram} />
                <B2BMetaCard program={activeProgram} isClosedYear={isClosedYear} />
                <TeamCard program={activeProgram} allSellers={data.sellers} />
              </section>
              <B2BFunnelRow program={activeProgram} />
            </>
          )}
        </div>

        <AlertDealsModal
          open={activeAlertKey != null}
          alertKey={activeAlertKey}
          alert={activeProgram?.alerts?.[activeAlertKey]}
          onClose={() => setActiveAlertKey(null)}
        />
      </div>
    </div>
  )
}
