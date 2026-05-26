import { useEffect, useRef, useState, useCallback } from 'react'
import { useDashboardData } from '../hooks/useDashboardData.js'
import { Topbar } from '../components/pekate-dash/Topbar.jsx'
import { PulseRow } from '../components/pekate-dash/PulseRow.jsx'
import { AlertsStrip } from '../components/pekate-dash/AlertsStrip.jsx'
import { FocusRow } from '../components/pekate-dash/FocusRow.jsx'
import { FunnelRow } from '../components/pekate-dash/FunnelRow.jsx'
import { Roulette } from '../components/pekate-dash/Roulette.jsx'
import { ReportPreview } from '../components/pekate-dash/ReportPreview.jsx'
import { useReportData } from '../hooks/useReportData.js'
import './pekate-dash.css'

const CAROUSEL = [
  { id: 'gecom',  duration: 20000 },
  { id: 'pos',    duration: 30000 },
  { id: 'clevel', duration: 20000 },
  { id: 'gef',    duration: 20000 },
]

export function PekateDash() {
  const { data, lastUpdated } = useDashboardData()
  const [activeIdx, setActiveIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const [epoch, setEpoch] = useState(0)
  const [rouletteOpen, setRouletteOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const { report, loading: reportLoading, generate: generateReport } = useReportData()
  const stageRef = useRef(null)

  const activeId = CAROUSEL[activeIdx].id
  const duration = CAROUSEL[activeIdx].duration

  const handleManualSelect = useCallback((id) => {
    const idx = CAROUSEL.findIndex((c) => c.id === id)
    if (idx >= 0) {
      setActiveIdx(idx)
      setEpoch((e) => e + 1)
    }
  }, [])

  useEffect(() => {
    if (paused) return
    const timer = setTimeout(() => {
      setActiveIdx((i) => (i + 1) % CAROUSEL.length)
      setEpoch((e) => e + 1)
    }, duration)
    return () => clearTimeout(timer)
  }, [activeIdx, paused, duration, epoch])

  useEffect(() => {
    function fit() {
      const stage = stageRef.current
      if (!stage) return
      const w = window.innerWidth || document.documentElement.clientWidth
      const h = window.innerHeight || document.documentElement.clientHeight
      if (!w || !h) return
      const s = Math.min(w / 1920, h / 1080)
      if (s > 0) stage.style.setProperty('--stage-scale', s)
    }
    fit()
    window.addEventListener('resize', fit)
    let tries = 0
    const retry = setInterval(() => {
      fit()
      if (++tries > 12) clearInterval(retry)
    }, 80)
    return () => {
      window.removeEventListener('resize', fit)
      clearInterval(retry)
    }
  }, [])

  const activeProgram = data?.programs?.find((p) => p.id === activeId)
  const accent = activeProgram?.accentColor || '#F26522'

  return (
    <div className="pkt-letterbox">
      <div className="pkt-stage" ref={stageRef}>
        <div className="pkt-dash" style={{ '--pgm-accent': accent }}>
          <Topbar paused={paused} onTogglePause={() => setPaused((p) => !p)} onOpenRoulette={() => setRouletteOpen(true)} onOpenReport={() => setReportOpen(true)} />
          <div className="pkt-progress-bar">
            <div
              key={`${activeIdx}-${epoch}`}
              className="pkt-progress-bar__fill"
              style={{
                animationDuration: `${duration}ms`,
                animationPlayState: paused ? 'paused' : 'running',
              }}
            />
          </div>
          {data?.programs && <PulseRow programs={data.programs} activeId={activeId} onSelect={handleManualSelect} />}
          <AlertsStrip lastUpdated={lastUpdated} program={activeProgram} />
          {data?.programs && (
            <>
              <FocusRow
                program={data.programs.find((p) => p.id === activeId)}
                allSellers={data.sellers}
              />
              <FunnelRow program={data.programs.find((p) => p.id === activeId)} />
            </>
          )}
        </div>
        <Roulette open={rouletteOpen} onClose={() => setRouletteOpen(false)} />
        {reportOpen && (
          <ReportPreview
            report={report}
            loading={reportLoading}
            onClose={() => setReportOpen(false)}
            onGenerate={() => data?.programs && generateReport(data.programs, data.sellers)}
          />
        )}
      </div>
    </div>
  )
}
