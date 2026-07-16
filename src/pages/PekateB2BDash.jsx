import { useEffect, useState, useCallback } from 'react'
import { useB2BDashboardData } from '../hooks/useB2BDashboardData.js'
import { useStageScale } from '../hooks/useStageScale.js'
import { B2B_YEAR_OPTIONS, PROGRAMS_B2B } from '../config/pipedrive.js'
import { B2BTopbar } from '../components/pekate-dash-b2b/B2BTopbar.jsx'
import { PeriodSelector } from '../components/pekate-dash-b2b/PeriodSelector.jsx'
import { B2BPulseRow } from '../components/pekate-dash-b2b/B2BPulseRow.jsx'
import { B2BKpiStack } from '../components/pekate-dash-b2b/B2BKpiStack.jsx'
import { B2BMetaCard } from '../components/pekate-dash-b2b/B2BMetaCard.jsx'
import { B2BFunnelRow } from '../components/pekate-dash-b2b/B2BFunnelRow.jsx'
import './pekate-dash-b2b.css'

const CAROUSEL_DURATION = 20000
const CAROUSEL = PROGRAMS_B2B.map((p) => p.id)

function currentDefaultHalf() {
  return new Date().getMonth() < 6 ? 'S1' : 'S2'
}

export function PekateB2BDash() {
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [half, setHalf] = useState(currentDefaultHalf)
  const [activeIdx, setActiveIdx] = useState(0)
  const [epoch, setEpoch] = useState(0)
  const { data } = useB2BDashboardData({ year, half })
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
    const timer = setTimeout(() => {
      setActiveIdx((i) => (i + 1) % CAROUSEL.length)
      setEpoch((e) => e + 1)
    }, CAROUSEL_DURATION)
    return () => clearTimeout(timer)
  }, [activeIdx, epoch])

  const activeProgram = data?.programs?.find((p) => p.id === activeId)
  const accent = activeProgram?.accentColor || '#08373F'

  return (
    <div className="pktb2b-letterbox">
      <div className="pktb2b-stage" ref={stageRef}>
        <div className="pktb2b-dash" style={{ '--pgm-accent': accent }}>
          <B2BTopbar />

          <div className="pktb2b-controls">
            <PeriodSelector
              year={year}
              half={half}
              yearOptions={B2B_YEAR_OPTIONS}
              onChangeYear={setYear}
              onChangeHalf={setHalf}
            />
            <div className="pktb2b-progress-bar">
              <div
                key={`${activeIdx}-${epoch}`}
                className="pktb2b-progress-bar__fill"
                style={{ animationDuration: `${CAROUSEL_DURATION}ms` }}
              />
            </div>
          </div>

          {data?.programs && (
            <>
              <B2BPulseRow programs={data.programs} activeId={activeId} onSelect={handleManualSelect} />
              <section className="pktb2b-focus">
                <B2BKpiStack program={activeProgram} />
                <B2BMetaCard program={activeProgram} half={half} />
              </section>
              <B2BFunnelRow program={activeProgram} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
