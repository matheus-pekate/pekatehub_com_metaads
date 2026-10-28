import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDashboardData } from '../hooks/useDashboardData.js'
import { Topbar } from '../components/pekate-dash/Topbar.jsx'
import { PulseRow } from '../components/pekate-dash/PulseRow.jsx'
import { AlertsStrip } from '../components/pekate-dash/AlertsStrip.jsx'
import { FocusRow } from '../components/pekate-dash/FocusRow.jsx'
import { FunnelRow } from '../components/pekate-dash/FunnelRow.jsx'
import { Roulette } from '../components/pekate-dash/Roulette.jsx'
import { ReportPreview } from '../components/pekate-dash/ReportPreview.jsx'
import { AlertDealsModal } from '../components/pekate-dash/AlertDealsModal.jsx'
import { YearPicker } from '../components/pekate-dash/YearPicker.jsx'
import { useReportData } from '../hooks/useReportData.js'
import { PROGRAMS, B2C_YEARS } from '../config/pipedrive.js'
import './pekate-dash.css'

const CAROUSEL = [
  { id: 'gecom',  duration: 20000 },
  { id: 'pos',    duration: 30000 },
  { id: 'clevel', duration: 20000 },
  { id: 'gef',    duration: 20000 },
  { id: 'pdd',    duration: 20000 },
  { id: 'pdc',    duration: 20000 },
]

const YEAR_BY_ID = Object.fromEntries(PROGRAMS.map((p) => [p.id, p.year]))

// Escala o palco fixo de 1920x1080 pra caber na janela (TV ou notebook).
function useStageFit(stageRef) {
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
  }, [stageRef])
}

// Sem ?ano= na URL mostra a tela de seleção; com um ano válido, o painel só
// com as turmas daquele ano. Os dados ficam aqui em cima pra trocar de ano
// sem buscar tudo de novo no Pipedrive.
export function PekateDash() {
  const [params, setParams] = useSearchParams()
  const dashboard = useDashboardData()
  const year = Number(params.get('ano'))
  const validYear = B2C_YEARS.some((y) => y.year === year)

  if (!validYear) {
    return <YearStage onSelect={(y) => setParams({ ano: String(y) })} />
  }
  return <ComandoB2C key={year} year={year} dashboard={dashboard} onChangeYear={() => setParams({})} />
}

function YearStage({ onSelect }) {
  const stageRef = useRef(null)
  useStageFit(stageRef)
  return (
    <div className="pkt-letterbox">
      <div className="pkt-stage" ref={stageRef}>
        <YearPicker onSelect={onSelect} />
      </div>
    </div>
  )
}

function ComandoB2C({ year, dashboard, onChangeYear }) {
  const { data: allData, lastUpdated } = dashboard
  const carousel = useMemo(() => CAROUSEL.filter((c) => YEAR_BY_ID[c.id] === year), [year])
  const data = useMemo(
    () => allData && { ...allData, programs: allData.programs?.filter((p) => p.year === year) },
    [allData, year],
  )
  const [activeIdx, setActiveIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const [epoch, setEpoch] = useState(0)
  const [rouletteOpen, setRouletteOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [activeAlertKey, setActiveAlertKey] = useState(null)
  const { report, loading: reportLoading, generate: generateReport } = useReportData()
  const stageRef = useRef(null)
  useStageFit(stageRef)

  const activeId = carousel[activeIdx].id
  const duration = carousel[activeIdx].duration

  const handleManualSelect = useCallback((id) => {
    const idx = carousel.findIndex((c) => c.id === id)
    if (idx >= 0) {
      setActiveIdx(idx)
      setEpoch((e) => e + 1)
    }
  }, [carousel])

  useEffect(() => {
    if (paused || activeAlertKey) return
    const timer = setTimeout(() => {
      setActiveIdx((i) => (i + 1) % carousel.length)
      setEpoch((e) => e + 1)
    }, duration)
    return () => clearTimeout(timer)
  }, [activeIdx, paused, duration, epoch, activeAlertKey, carousel.length])

  const activeProgram = data?.programs?.find((p) => p.id === activeId)
  const accent = activeProgram?.accentColor || '#F26522'

  return (
    <div className="pkt-letterbox">
      <div className="pkt-stage" ref={stageRef}>
        <div className="pkt-dash" style={{ '--pgm-accent': accent }}>
          <Topbar year={year} onChangeYear={onChangeYear} paused={paused} onTogglePause={() => setPaused((p) => !p)} onOpenRoulette={() => setRouletteOpen(true)} onOpenReport={() => setReportOpen(true)} />
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
          <AlertsStrip lastUpdated={lastUpdated} program={activeProgram} onSelectAlert={(key) => setActiveAlertKey(key)} />
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
            onGenerate={() => allData?.programs && generateReport(allData.programs, allData.sellers)}
          />
        )}
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
