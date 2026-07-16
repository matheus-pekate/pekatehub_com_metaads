import { useState } from 'react'
import { useB2BDashboardData } from '../hooks/useB2BDashboardData.js'
import { useStageScale } from '../hooks/useStageScale.js'
import { B2B_YEAR_OPTIONS } from '../config/pipedrive.js'
import { B2BTopbar } from '../components/pekate-dash-b2b/B2BTopbar.jsx'
import { PeriodSelector } from '../components/pekate-dash-b2b/PeriodSelector.jsx'
import { ProgramSummaryCard } from '../components/pekate-dash-b2b/ProgramSummaryCard.jsx'
import './pekate-dash-b2b.css'

function currentDefaultHalf() {
  return new Date().getMonth() < 6 ? 'S1' : 'S2'
}

export function PekateB2BDash() {
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [half, setHalf] = useState(currentDefaultHalf)
  const { data } = useB2BDashboardData({ year, half })
  const stageRef = useStageScale()

  return (
    <div className="pktb2b-letterbox">
      <div className="pktb2b-stage" ref={stageRef}>
        <div className="pktb2b-dash">
          <B2BTopbar />

          <PeriodSelector
            year={year}
            half={half}
            yearOptions={B2B_YEAR_OPTIONS}
            onChangeYear={setYear}
            onChangeHalf={setHalf}
          />

          {data?.programs && (
            <div className="pktb2b-grid">
              {data.programs.map((program) => (
                <ProgramSummaryCard key={program.id} program={program} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
