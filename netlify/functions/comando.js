// Expõe os números dos painéis Comando B2C (src/pages/PekateDash.jsx) e
// Comando B2B (src/pages/PekateB2BDash.jsx) em JSON, pra um agente do n8n
// consultar sob demanda — o cálculo vive em src/lib/comandoData.js e reusa a
// mesma lógica dos dashboards, então nunca fica dessincronizado.
//
// GET /api/comando?segment=ambos|b2c|b2b&year=2026 (year só vale pro B2B; default = ano atual)
//
// Mesma coisa em protocolo MCP: netlify/functions/mcp.js (POST /mcp).
//
// Se a env var METAS_API_SECRET estiver configurada na Netlify, a chamada
// precisa do header `x-metas-secret` com o mesmo valor — sem essa env var,
// o endpoint fica aberto (mesma postura dos outros endpoints deste hub).
import { loadB2C, loadB2B } from '../../src/lib/comandoData.js'

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const requiredSecret = process.env.METAS_API_SECRET
  if (requiredSecret) {
    const provided = event.headers['x-metas-secret'] || event.headers['X-Metas-Secret']
    if (provided !== requiredSecret) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Não autorizado' }) }
    }
  }

  const segmentParam = (event.queryStringParameters?.segment || 'ambos').toLowerCase()
  const wantB2C = segmentParam === 'ambos' || segmentParam === 'b2c'
  const wantB2B = segmentParam === 'ambos' || segmentParam === 'b2b'
  if (!wantB2C && !wantB2B) {
    return { statusCode: 400, body: JSON.stringify({ error: 'segment deve ser "ambos", "b2c" ou "b2b"' }) }
  }

  const yearParam = Number(event.queryStringParameters?.year)
  const year = Number.isInteger(yearParam) ? yearParam : new Date().getFullYear()

  try {
    const [b2c, b2b] = await Promise.all([
      wantB2C ? loadB2C() : null,
      wantB2B ? loadB2B(year) : null,
    ])

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        generatedAt: new Date().toISOString(),
        ...(b2c ? { b2c } : {}),
        ...(b2b ? { b2b } : {}),
      }),
    }
  } catch (err) {
    console.error('[comando]', err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Erro ao calcular os dados dos comandos' }) }
  }
}
