import { useState, useCallback } from 'react'
import { fetchUserActivities } from '../services/pipedriveApi.js'
import { generateExecutiveSummary } from '../services/claudeApi.js'

const MS_PER_DAY = 86400000

function buildProgramReport(program) {
  const {
    name, shortName, converted, goal, price, totalWonValue, forecast,
    forecastCount, conversionRate, totalDealsCount, totalActive,
    stagesData, sellers, startDate, revenueGoal,
  } = program

  const revenueTarget = revenueGoal || goal * (price || 0)
  const revenue = converted * (price || 0)
  const revenuePct = revenueTarget > 0 ? Math.round((revenue / revenueTarget) * 100) : 0
  const goalPct = goal > 0 ? Math.round((converted / goal) * 100) : 0

  const now = new Date()
  const start = startDate ? new Date(startDate + 'T00:00:00') : null
  const daysLeft = start ? Math.max(0, Math.ceil((start - now) / MS_PER_DAY)) : null

  const daysSinceFirst = 30
  const ratePerDay = daysSinceFirst > 0 ? converted / daysSinceFirst : 0
  const projected = daysLeft != null ? converted + Math.round(ratePerDay * daysLeft) : null
  const projectedPct = goal > 0 && projected != null ? Math.round((projected / goal) * 100) : null

  const openDeals = (program.deals || []).filter((d) => d.status === 'open')
  const criticalDeals = openDeals
    .map((d) => {
      const last = d.update_time || d.add_time
      const idle = last ? Math.floor((now - new Date(last)) / MS_PER_DAY) : 999
      return { id: d.id, title: d.title, idle, stageId: d.stage_id, ownerId: d.owner_id }
    })
    .filter((d) => d.idle > 14)
    .sort((a, b) => b.idle - a.idle)
    .slice(0, 10)

  return {
    name, shortName, converted, goal, goalPct,
    revenue, revenueTarget, revenuePct,
    forecast, forecastCount,
    conversionRate: Math.round(conversionRate * 10) / 10,
    totalDealsCount, totalActive,
    stagesData: (stagesData || []).map((s) => ({ name: s.name, count: s.count })),
    sellers: (sellers || []).slice(0, 5).map((s) => ({
      id: s.id, name: s.name, converted: s.converted, active: s.active,
    })),
    daysLeft,
    projected, projectedPct,
    criticalDeals,
  }
}

export function useReportData() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)

  const generate = useCallback(async (programs, globalSellers) => {
    setLoading(true)
    try {
      const programReports = programs.map(buildProgramReport)

      const allSellerIds = new Set()
      programReports.forEach((pr) => pr.sellers.forEach((s) => allSellerIds.add(s.id)))

      let activitiesMap = {}
      try {
        const actResults = await Promise.all(
          [...allSellerIds].map(async (id) => {
            const acts = await fetchUserActivities(id, 7)
            return { id, acts: acts || [] }
          })
        )
        actResults.forEach(({ id, acts }) => {
          const summary = { calls: 0, emails: 0, meetings: 0, total: 0 }
          acts.forEach((a) => {
            summary.total++
            const t = (a.type || '').toLowerCase()
            if (t.includes('call') || t.includes('ligação') || t.includes('liga')) summary.calls++
            else if (t.includes('email') || t.includes('e-mail')) summary.emails++
            else if (t.includes('meeting') || t.includes('reunião') || t.includes('reuniao')) summary.meetings++
          })
          activitiesMap[id] = summary
        })
      } catch {
        // activities fetch failed — proceed without
      }

      programReports.forEach((pr) => {
        pr.sellers = pr.sellers.map((s) => ({
          ...s,
          activities: activitiesMap[s.id] || { calls: 0, emails: 0, meetings: 0, total: 0 },
        }))
      })

      const overview = programReports.map((pr) => ({
        shortName: pr.shortName,
        converted: pr.converted,
        goal: pr.goal,
        goalPct: pr.goalPct,
        revenue: pr.revenue,
        forecast: pr.forecast,
      }))

      const now = new Date()
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay())
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)

      const fmt = (d) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

      const reportData = {
        generatedAt: now.toLocaleString('pt-BR'),
        period: `${fmt(weekStart)} a ${fmt(weekEnd)}`,
        overview,
        programs: programReports,
        executiveSummary: null,
      }

      setReport(reportData)

      try {
        const summary = await generateExecutiveSummary(reportData)
        setReport((prev) => prev ? { ...prev, executiveSummary: summary } : prev)
      } catch {
        setReport((prev) => prev ? { ...prev, executiveSummary: 'Não foi possível gerar o resumo executivo.' } : prev)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  return { report, loading, generate }
}
