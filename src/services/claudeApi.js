const API_KEY = import.meta.env.VITE_ANTHROPIC_KEY

export async function generateExecutiveSummary(reportData) {
  if (!API_KEY || API_KEY.includes('COLE_SUA_CHAVE')) {
    return 'Resumo executivo indisponível — configure VITE_ANTHROPIC_KEY no arquivo .env.'
  }

  const dataPayload = reportData.programs.map((p) => ({
    programa: p.name,
    convertidos: p.converted,
    meta: p.goal,
    percentualMeta: p.goalPct,
    receita: p.revenue,
    metaReceita: p.revenueTarget,
    taxaConversao: p.conversionRate,
    totalDeals: p.totalDealsCount,
    leadsAtivos: p.totalActive,
    forecast: p.forecast,
    projecao: p.projected,
    projecaoPct: p.projectedPct,
    diasRestantes: p.daysLeft,
    funil: p.stagesData,
    topVendedores: p.sellers.map((s) => ({
      nome: s.name,
      convertidos: s.converted,
      ativos: s.active,
      atividades7d: s.activities,
    })),
    dealsCriticos: p.criticalDeals.length,
  }))

  const prompt = `Você é um analista comercial sênior da Pekatê Brasil. Analise os dados abaixo dos programas B2C e escreva um resumo executivo em português brasileiro.

Cubra obrigatoriamente:
1. Panorama geral — qual programa está melhor posicionado e qual preocupa mais
2. Gargalos do funil — onde os leads estão travando, quais stages concentram demais ou convertem de menos
3. Destaques de vendedores — quem está performando acima da média e quem precisa de atenção
4. Recomendações — 2 a 3 ações concretas e prioritárias para a próxima semana

Dados dos programas:
${JSON.stringify(dataPayload, null, 2)}

REGRAS DE FORMATAÇÃO (siga rigorosamente):
- Retorne APENAS HTML puro, sem bloco de código, sem crases, sem markdown.
- Use tags HTML para estruturar: <h4> para títulos de seção, <p> para parágrafos, <b> para destaques, <ul><li> para listas, <table><tr><td> para comparações se cabível.
- NÃO inclua <html>, <head>, <body> nem <style>. Apenas o conteúdo HTML direto.
- NÃO use emojis.
- Tom direto, objetivo e executivo. Use dados numéricos para sustentar as análises. Interprete os dados — não os repita brutos.`

  const res = await fetch('/api/anthropic/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('[claudeApi] Erro:', res.status, err)
    throw new Error(`Claude API error: ${res.status} — ${err}`)
  }

  const json = await res.json()
  return json.content?.[0]?.text || 'Não foi possível gerar o resumo.'
}
