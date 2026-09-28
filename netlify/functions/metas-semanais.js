// Expõe os números do painel "Metas Semanais" (src/pages/MetasSemanais.jsx)
// em JSON, pra um agente do n8n (ou qualquer outro consumidor externo)
// consultar sob demanda — o cálculo vive em src/lib/metasData.js e reusa a
// mesma lógica do painel (weeklyGoalsEngine.js), então os dois nunca divergem.
//
// GET /api/metas-semanais?segment=ambos|b2c|b2b
//
// Mesma coisa em protocolo MCP: netlify/functions/mcp.js (POST /mcp → tool metas_semanais).
//
// Se a env var METAS_API_SECRET estiver configurada na Netlify, a chamada
// precisa do header `x-metas-secret` com o mesmo valor — sem essa env var,
// o endpoint fica aberto (mesma postura dos outros endpoints deste hub).
import { loadMetas } from '../../src/lib/metasData.js'

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

  try {
    const data = await loadMetas(wantB2C, wantB2B)
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  } catch (err) {
    console.error('[metas-semanais]', err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Erro ao calcular as metas semanais' }) }
  }
}
