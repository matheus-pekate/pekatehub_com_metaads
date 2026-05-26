import { useMemo } from 'react'
import { PROGRAMS } from '../config/pipedrive.js'

const SEVERITY_ORDER = { critical: 0, warning: 1, opportunity: 2, insight: 3 }

function fmt(v) {
  const abs = Math.abs(v)
  if (abs >= 1000000) return `R$ ${(v / 1000000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}M`
  if (abs >= 1000) return `R$ ${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`
  return `R$ ${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
}

function fmtFull(v) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
}

function generateInsights(metrics, teamBenchmark, teamCadence, teamConversionDays, periodDays, selectedProgram) {
  if (!metrics) return []

  const insights = []
  const programCfg = selectedProgram ? PROGRAMS.find((p) => p.id === selectedProgram) : null

  // ── 1. INATIVIDADE — leads sem contato >7d (critical) ──
  if (metrics.cadence.leadsNoContact7d > 0) {
    const stagnant = metrics.dealsByStatus.stagnant || []
    const stageCounts = {}
    stagnant.forEach((d) => { stageCounts[d.stageName] = (stageCounts[d.stageName] || 0) + 1 })
    const topStage = Object.entries(stageCounts).sort((a, b) => b[1] - a[1])[0]

    insights.push({
      type: 'INATIVIDADE',
      severity: 'critical',
      title: `${metrics.cadence.leadsNoContact7d} leads sem contato há mais de 7 dias`,
      description: topStage
        ? `Concentração em "${topStage[0]}" — risco de esfriamento.`
        : 'Risco de esfriamento na carteira.',
      action: { scrollTo: 'sa-deals', tab: 'stagnant' },
    })
  }

  // ── 2. ESTAGNAÇÃO — deals parados >14d (critical) ──
  if (metrics.velocity.stagnantCount > 0) {
    const stagnant = metrics.dealsByStatus.stagnant || []
    const stageValues = {}
    stagnant.forEach((d) => { stageValues[d.stageName] = (stageValues[d.stageName] || 0) + d.value })
    const topStage = Object.entries(stageValues).sort((a, b) => b[1] - a[1])[0]

    insights.push({
      type: 'ESTAGNAÇÃO',
      severity: 'critical',
      title: `${metrics.velocity.stagnantCount} deals parados há mais de 14 dias`,
      description: `${fmtFull(metrics.velocity.stagnantValue)} em pipeline travado${topStage ? ` em "${topStage[0]}".` : '.'}`,
      action: { scrollTo: 'sa-deals', tab: 'stagnant' },
    })
  }

  // ── 3. CONVERSÃO — queda vs período anterior (warning) ──
  if (metrics.conversionRateDelta < 0) {
    const prevRate = Math.round((metrics.conversionRate - metrics.conversionRateDelta) * 10) / 10
    const belowBenchmark = metrics.conversionRate < teamBenchmark
    insights.push({
      type: 'CONVERSÃO',
      severity: 'warning',
      title: `Taxa caiu ${Math.abs(metrics.conversionRateDelta)} pp vs. período anterior`,
      description: `De ${prevRate}% para ${metrics.conversionRate}%${belowBenchmark ? ' — abaixo do benchmark do time.' : '.'}`,
      action: { scrollTo: 'sa-kpis' },
    })
  }

  // ── 4. E-MAILS / MIX DESBALANCEADO (warning) ──
  if (metrics.activities.emails === 0 && periodDays >= 7) {
    insights.push({
      type: 'E-MAILS',
      severity: 'warning',
      title: `Zero e-mails enviados em ${periodDays} dias`,
      description: metrics.concentration
        ? `Mix muito concentrado em ${metrics.concentration.channel} (${metrics.concentration.pct}%).`
        : 'Canal de e-mail não está sendo utilizado.',
      action: { scrollTo: 'sa-activity' },
    })
  } else if (metrics.concentration && metrics.concentration.pct > 85) {
    insights.push({
      type: 'CADÊNCIA',
      severity: 'warning',
      title: `Mix concentrado em ${metrics.concentration.channel} (${metrics.concentration.pct}%)`,
      description: 'Sugerido diversificar canais: 60% ligações / 30% reuniões / 10% e-mails.',
      action: { scrollTo: 'sa-activity' },
    })
  }

  // ── 5. VELOCIDADE — gargalo detectado (warning) ──
  if (metrics.velocity.gargalo) {
    insights.push({
      type: 'VELOCIDADE',
      severity: 'warning',
      title: `Gargalo em "${metrics.velocity.gargalo.name}"`,
      description: `${metrics.velocity.gargalo.days} dias em média — ${metrics.velocity.gargalo.delta}d acima da média dos stages.`,
      action: { scrollTo: 'sa-velocity' },
    })
  }

  // ── 6. ÚLTIMA ATIVIDADE fora da janela (warning) ──
  if (metrics.cadence.lastActivityDaysAgo !== null && metrics.cadence.lastActivityDaysAgo > 3) {
    insights.push({
      type: 'ATIVIDADE',
      severity: 'warning',
      title: `Sem atividades nos últimos ${metrics.cadence.lastActivityDaysAgo} dias`,
      description: 'Cadência fora da janela ideal de 3 dias.',
      action: { scrollTo: 'sa-activity' },
    })
  }

  // ── 7. RECEITA — queda vs período anterior (warning) ──
  if (metrics.revenueDelta < 0) {
    insights.push({
      type: 'RECEITA',
      severity: 'warning',
      title: `Receita caiu ${fmt(Math.abs(metrics.revenueDelta))} vs. período anterior`,
      description: `De ${fmt(metrics.revenue + Math.abs(metrics.revenueDelta))} para ${fmt(metrics.revenue)}.`,
      action: { scrollTo: 'sa-kpis' },
    })
  }

  // ── 8. OPORTUNIDADE — deals em stages avançados (opportunity) ──
  if (metrics.portfolio && metrics.portfolio.stages.length >= 2) {
    const stages = metrics.portfolio.stages
    const lateStages = stages.slice(Math.ceil(stages.length / 2))
    const lateDeals = (metrics.dealsByStatus.open || []).filter((d) =>
      lateStages.some((s) => s.name === d.stageName) && d.value > 0
    )
    if (lateDeals.length > 0) {
      const totalValue = lateDeals.reduce((sum, d) => sum + d.value, 0)
      const topDeal = lateDeals.sort((a, b) => b.value - a.value)[0]
      insights.push({
        type: 'OPORTUNIDADE',
        severity: 'opportunity',
        title: `${lateDeals.length} deals próximos do fechamento (>${fmt(Math.min(...lateDeals.map((d) => d.value)))})`,
        description: topDeal
          ? `${topDeal.title.slice(0, 40)} com ${Math.round(topDeal.daysInFunnel || 0)}d de funil — priorizar follow-up.`
          : `${fmt(totalValue)} em pipeline avançado.`,
        action: { scrollTo: 'sa-deals', tab: 'open', sort: 'value-desc' },
      })
    }
  }

  // ── 9. META — projeção de receita (insight) ──
  if (programCfg && programCfg.revenueGoal) {
    const remaining = programCfg.revenueGoal - metrics.revenue
    if (remaining > 0) {
      const dailyRate = periodDays > 0 ? metrics.revenue / periodDays : 0
      const projected30d = Math.round(dailyRate * 30)
      insights.push({
        type: 'META',
        severity: 'insight',
        title: `Faltam ${fmt(remaining)} para bater a meta`,
        description: `Ritmo atual projeta ${fmt(projected30d)} até o fim do mês.`,
        action: { scrollTo: 'sa-kpis' },
      })
    }
  }

  // ── 10. CADÊNCIA abaixo do time (insight) ──
  if (teamCadence > 0 && metrics.cadence.frequency < teamCadence && metrics.cadence.frequency > 0) {
    insights.push({
      type: 'CADÊNCIA',
      severity: 'insight',
      title: 'Frequência de contato abaixo do time',
      description: `${metrics.cadence.frequency} contatos/lead vs. média de ${teamCadence} do time.`,
      action: { scrollTo: 'sa-activity' },
    })
  }

  // ── 11. CONVERSÃO LENTA vs time (insight) ──
  if (metrics.velocity.avgConversionDays != null && teamConversionDays != null && metrics.velocity.avgConversionDays > teamConversionDays) {
    const delta = metrics.velocity.avgConversionDays - teamConversionDays
    insights.push({
      type: 'VELOCIDADE',
      severity: 'insight',
      title: `Conversão ${delta}d mais lenta que o time`,
      description: `${metrics.velocity.avgConversionDays} dias vs. média de ${teamConversionDays} dias do time.`,
      action: { scrollTo: 'sa-velocity' },
    })
  }

  return insights.sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99))
}

export function useSellerInsights(metrics, teamBenchmark, teamCadence, teamConversionDays, periodDays, selectedProgram) {
  const insights = useMemo(
    () => generateInsights(metrics, teamBenchmark, teamCadence, teamConversionDays, periodDays, selectedProgram),
    [metrics, teamBenchmark, teamCadence, teamConversionDays, periodDays, selectedProgram]
  )

  const counts = useMemo(() => {
    const c = { critical: 0, warning: 0, opportunity: 0, insight: 0 }
    insights.forEach((i) => c[i.severity]++)
    return c
  }, [insights])

  return { insights, counts, total: insights.length }
}
