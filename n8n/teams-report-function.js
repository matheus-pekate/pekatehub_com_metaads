// ─────────────────────────────────────────────────────────
// n8n Function Node — Formata payload do relatório em
// HTML para envio via nó Microsoft Teams (Content Type: HTML)
// ─────────────────────────────────────────────────────────

const report = $input.first().json.body;

function brl(value) {
  if (value == null) return 'R$ 0';
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1).replace('.', ',')}M`;
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(1).replace('.', ',')}k`;
  return `R$ ${value}`;
}

function pctEmoji(pct) {
  if (pct >= 90) return '🟢';
  if (pct >= 50) return '🟡';
  return '🔴';
}

// ── Header ──────────────────────────────────────────────
let html = `
<h2>📊 Relatório Semanal</h2>
<p><b>Pekatê Brasil · Comando B2C</b><br/>
📅 Período: <b>${report.period}</b> · 🕐 Gerado em: ${report.generatedAt}</p>
<br/>
<hr/>
<br/>
`;

// ── Visão Geral (tabela) ────────────────────────────────
html += `<h3>📋 Visão Geral</h3>
<br/>
<table>
<tr>
  <th>Programa</th><th>Conv.</th><th>Meta</th><th>%</th><th>Receita</th><th>Forecast</th>
</tr>`;

for (const p of report.overview) {
  html += `<tr>
  <td><b>${p.shortName}</b></td>
  <td>${p.converted}</td>
  <td>${p.goal}</td>
  <td>${pctEmoji(p.goalPct)} ${p.goalPct}%</td>
  <td>${brl(p.revenue)}</td>
  <td>${brl(p.forecast)}</td>
</tr>`;
}
html += `</table>
<br/><br/>
<hr/>
<br/>
`;

// ── Seções por programa ─────────────────────────────────
for (const p of report.programs) {
  html += `<h3>🎯 ${p.name}</h3>
<br/>`;

  // KPIs
  html += `<table>
<tr><td><b>Convertidos</b></td><td>${p.converted} / ${p.goal} (${p.goalPct}%)</td></tr>
<tr><td><b>Receita</b></td><td>${brl(p.revenue)} de ${brl(p.revenueTarget)} (${p.revenuePct}%)</td></tr>
<tr><td><b>Taxa conversão</b></td><td>${p.conversionRate}%</td></tr>
<tr><td><b>Forecast</b></td><td>${brl(p.forecast)} (${p.forecastCount} leads)</td></tr>
</table>
<br/>`;

  // Projeção
  if (p.projected != null) {
    let projText = `~${p.projected} alunos (${p.projectedPct}% da meta)`;
    if (p.daysLeft != null) projText += ` · ${p.daysLeft} dias restantes`;
    html += `<p>📈 <b>Projeção:</b> ${projText}</p>
<br/>`;
  }

  // Funil
  const funnelText = p.stagesData.map((s) => `${s.name}: <b>${s.count}</b>`).join(' → ');
  html += `<p><b>Funil:</b> ${funnelText}</p>
<br/>`;

  // Vendedores
  html += `<p><b>Vendedores (top 5)</b></p>
<br/>
<table>
<tr><th>#</th><th>Nome</th><th>Conv.</th><th>Ativos</th><th>Atividades (7d)</th></tr>`;
  for (let i = 0; i < p.sellers.length; i++) {
    const s = p.sellers[i];
    const acts = s.activities;
    const actText = acts.total > 0
      ? `${acts.total} (${acts.calls}☎ ${acts.emails}✉ ${acts.meetings}📅)`
      : '—';
    html += `<tr>
  <td>${i + 1}º</td>
  <td><b>${s.name}</b></td>
  <td>${s.converted}</td>
  <td>${s.active}</td>
  <td>${actText}</td>
</tr>`;
  }
  html += `</table>
<br/>`;

  // Deals críticos
  if (p.criticalDeals.length > 0) {
    html += `<p>⚠️ <b>Deals críticos (${p.criticalDeals.length})</b></p>
<br/>
<ul>`;
    const shown = p.criticalDeals.slice(0, 5);
    for (const d of shown) {
      html += `<li>${d.title} — <b>${d.idle} dias parado</b></li>`;
    }
    if (p.criticalDeals.length > 5) {
      html += `<li><i>...e mais ${p.criticalDeals.length - 5} deals</i></li>`;
    }
    html += `</ul>`;
  }

  html += `
<br/>
<hr/>
<br/>
`;
}

// ── Resumo Executivo ────────────────────────────────────
html += `<h3>🤖 Resumo Executivo <small>(Gerado por IA)</small></h3>
<br/>`;
if (report.executiveSummary && !report.executiveSummary.includes('indisponível')) {
  const paragraphs = report.executiveSummary.split('\n\n');
  for (const par of paragraphs) {
    html += `<p>${par}</p><br/>`;
  }
} else {
  html += `<p><i>Resumo executivo indisponível — chave da API não configurada.</i></p>`;
}

return [{ json: { html } }];
