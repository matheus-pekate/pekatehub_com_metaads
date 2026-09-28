// Servidor MCP remoto (Streamable HTTP) que expõe os painéis Comando B2C,
// Comando B2B e Metas Semanais como tools, pra qualquer ferramenta que fale
// MCP (Claude, ChatGPT, n8n MCP Client, etc.) ler os painéis sob demanda.
//
// URL do servidor: https://pkt-hub.netlify.app/mcp
//
// Protocolo: MCP 2025-06-18 (Streamable HTTP, stateless).
//   - POST /mcp  → aceita JSON-RPC simples ou batch, responde em JSON ou SSE
//                  conforme o header Accept enviado pelo cliente.
//   - 202 vazio  → qualquer mensagem que seja só notificação (sem id) — o caso
//                  mais comum é notifications/initialized logo após o handshake.
//   - GET /mcp   → 405 (sem canal SSE do servidor — este servidor é stateless).
//   - Negocia protocolVersion: se o cliente pedir uma versão desconhecida,
//                  responde com DEFAULT_PROTOCOL em vez de recusar.
//
// Os dados vêm dos módulos compartilhados:
//   - src/lib/comandoData.js → B2C e B2B (reusa hooks dos dashboards)
//   - src/lib/metasData.js   → Metas Semanais (reusa weeklyGoalsEngine.js)
// Esses módulos também alimentam os endpoints REST (/api/comando e
// /api/metas-semanais), então o MCP nunca fica dessincronizado com as telas.
//
// Autenticação: se a env var METAS_API_SECRET estiver configurada na Netlify,
// a chamada precisa trazer o segredo em um destes (nessa ordem):
//   - header "Authorization: Bearer <segredo>"
//   - header "x-metas-secret: <segredo>"
//   - query string "?secret=<segredo>" (útil para clientes que só aceitam URL)
// Sem essa env var, o endpoint fica aberto (mesma postura dos outros do hub).
import { loadB2C, loadB2B } from '../../src/lib/comandoData.js'
import { loadMetas } from '../../src/lib/metasData.js'

const SERVER_INFO = { name: 'pkt-hub', version: '1.1.0', title: 'PKT-HUB — Painéis Pekatê' }

// Versões de protocolo suportadas, da mais recente pra mais antiga.
// Se o cliente pedir outra, respondemos com DEFAULT_PROTOCOL (negociação, não recusa).
const SUPPORTED_PROTOCOLS = ['2025-06-18', '2025-03-26', '2024-11-05']
const DEFAULT_PROTOCOL = '2025-06-18'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-metas-secret, mcp-protocol-version, mcp-session-id',
  'Access-Control-Expose-Headers': 'mcp-session-id, mcp-protocol-version',
  'Access-Control-Max-Age': '86400',
}

// ─── Definição das tools ─────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'comando_b2c',
    title: 'Comando B2C',
    description:
      'Lê o painel Comando B2C do PKT-HUB (Pipedrive): por programa, quantos alunos foram matriculados, ' +
      'valor arrecadado, ticket médio, leads ativos, forecast, taxa de conversão, % da meta, ' +
      'alertas (críticos / pendências / oportunidades prontas pra fechar) e desempenho por vendedor. ' +
      'Use quando perguntarem sobre matrículas, vendas B2C, metas dos programas ou leads parados.',
    inputSchema: {
      type: 'object',
      properties: {
        detalhado: {
          type: 'boolean',
          description: 'true inclui as listas de alertas (com exemplos de negócios) e o desempenho por vendedor. Padrão: false (só os números por programa).',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'comando_b2b',
    title: 'Comando B2B',
    description:
      'Lê o painel Comando B2B do PKT-HUB (Pipedrive): por programa e por ano, negócios ganhos, ' +
      'valor faturado, ticket médio, pipeline aberto, forecast, taxa de conversão, % da meta anual, ' +
      'quanto falta pra meta, alertas e desempenho por vendedor. ' +
      'Use quando perguntarem sobre vendas B2B, contratos corporativos ou pipeline empresarial.',
    inputSchema: {
      type: 'object',
      properties: {
        year: {
          type: 'integer',
          description: 'Ano do período analisado. Padrão: ano atual.',
        },
        detalhado: {
          type: 'boolean',
          description: 'true inclui as listas de alertas (com exemplos de negócios) e o desempenho por vendedor. Padrão: false (só os números por programa).',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'metas_semanais',
    title: 'Metas Semanais',
    description:
      'Lê o painel Metas Semanais do PKT-HUB: por vendedor e por semana atual, quantos negócios foram fechados, ' +
      'receita gerada, leads qualificados, atividades realizadas (SDRs), % atingido da meta e a meta configurada no Pipedrive. ' +
      'Inclui vendedores B2C e B2B. Use quando perguntarem sobre desempenho individual, progresso semanal ' +
      'ou se um vendedor está batendo a meta desta semana.',
    inputSchema: {
      type: 'object',
      properties: {
        segment: {
          type: 'string',
          enum: ['ambos', 'b2c', 'b2b'],
          description: 'Qual segmento carregar. Padrão: "ambos".',
        },
      },
      additionalProperties: false,
    },
  },
]

// ─── Helpers de projeção ──────────────────────────────────────────────────────

// Sem `detalhado`, remove alertas e sellers: é muita coisa pra janela de
// contexto quando o agente só quer saber como está a meta do programa.
function projectProgram(program, detalhado) {
  if (detalhado) return program
  const { alerts, sellers, ...rest } = program
  return {
    ...rest,
    alertCounts: {
      critico: alerts.critico.count,
      pendencia: alerts.pendencia.count,
      oportunidade: alerts.oportunidade.count,
    },
  }
}

// ─── Execução das tools ───────────────────────────────────────────────────────

async function runTool(name, args = {}) {
  if (name === 'comando_b2c') {
    const detalhado = args.detalhado === true
    const { programs } = await loadB2C()
    return {
      painel: 'Comando B2C',
      generatedAt: new Date().toISOString(),
      programs: programs.map((p) => projectProgram(p, detalhado)),
    }
  }

  if (name === 'comando_b2b') {
    const detalhado = args.detalhado === true
    const year = Number.isInteger(args.year) ? args.year : new Date().getFullYear()
    const result = await loadB2B(year)
    return {
      painel: 'Comando B2B',
      generatedAt: new Date().toISOString(),
      year: result.year,
      programs: result.programs.map((p) => projectProgram(p, detalhado)),
    }
  }

  if (name === 'metas_semanais') {
    const seg = (args.segment || 'ambos').toLowerCase()
    const wantB2C = seg === 'ambos' || seg === 'b2c'
    const wantB2B = seg === 'ambos' || seg === 'b2b'
    return loadMetas(wantB2C, wantB2B)
  }

  return null
}

// ─── JSON-RPC ─────────────────────────────────────────────────────────────────

function rpcResult(id, result) {
  return { jsonrpc: '2.0', id, result }
}

function rpcError(id, code, message) {
  return { jsonrpc: '2.0', id: id ?? null, error: { code, message } }
}

// Retorna null para mensagens que são puras notificações (sem id) — o chamador
// filtra os nulls e, se sobrar array vazio, responde 202 sem body.
// Isso é o comportamento correto pra notifications/initialized e similares.
async function handleMessage(msg) {
  if (!msg || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') {
    return rpcError(msg?.id, -32600, 'Requisição JSON-RPC inválida')
  }

  const { id, method, params } = msg
  // Notificação = mensagem sem id (undefined ou null) — nunca deve ter resposta.
  const isNotification = id === undefined || id === null

  switch (method) {
    case 'initialize': {
      // Negocia a versão: se o cliente pedir versão desconhecida, usa DEFAULT_PROTOCOL
      // em vez de recusar — compatibilidade máxima com clientes novos ou velhos.
      const requested = params?.protocolVersion
      const protocolVersion = SUPPORTED_PROTOCOLS.includes(requested) ? requested : DEFAULT_PROTOCOL
      return rpcResult(id, {
        protocolVersion,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions:
          'Três tools que leem os painéis de vendas da Pekatê Brasil direto do Pipedrive: ' +
          'comando_b2c (matrículas e metas dos programas), ' +
          'comando_b2b (negócios corporativos) e ' +
          'metas_semanais (desempenho individual por vendedor na semana). ' +
          'Chame comando_b2c/b2b com detalhado=true para ver alertas e vendedores. ' +
          'Cada campo summary já vem como uma frase pronta em português.',
      })
    }

    case 'ping':
      return rpcResult(id, {})

    case 'tools/list':
      return rpcResult(id, { tools: TOOLS })

    case 'resources/list':
      return rpcResult(id, { resources: [] })

    case 'prompts/list':
      return rpcResult(id, { prompts: [] })

    case 'tools/call': {
      const toolName = params?.name
      if (!TOOLS.some((t) => t.name === toolName)) {
        return rpcError(id, -32602, `Tool desconhecida: ${toolName}`)
      }
      try {
        const data = await runTool(toolName, params?.arguments || {})
        return rpcResult(id, {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
          structuredContent: data,
          isError: false,
        })
      } catch (err) {
        console.error('[mcp] tools/call', toolName, err)
        // Erro de execução vai como resultado com isError=true, não como erro
        // de protocolo — assim o agente consegue ler a mensagem e reagir.
        return rpcResult(id, {
          content: [{ type: 'text', text: `Erro ao consultar ${toolName}: ${err.message}` }],
          isError: true,
        })
      }
    }

    default:
      // Notificações (ex.: notifications/initialized) → retorna null para que
      // o chamador responda 202 sem body, conforme o protocolo exige.
      if (isNotification) return null
      return rpcError(id, -32601, `Método não suportado: ${method}`)
  }
}

// ─── Autenticação ─────────────────────────────────────────────────────────────

function authorized(event) {
  const requiredSecret = process.env.METAS_API_SECRET
  if (!requiredSecret) return true

  const headers = event.headers || {}
  const auth = headers.authorization || headers.Authorization || ''
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : null
  const provided = bearer
    || headers['x-metas-secret']
    || headers['X-Metas-Secret']
    || event.queryStringParameters?.secret

  return provided === requiredSecret
}

// ─── Handler Netlify ──────────────────────────────────────────────────────────

export const handler = async (event) => {
  // Preflight CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' }
  }

  if (!authorized(event)) {
    return {
      statusCode: 401,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify(rpcError(null, -32001, 'Não autorizado')),
    }
  }

  // GET não tem o que entregar: este servidor é stateless, não mantém SSE aberto.
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json', Allow: 'POST, OPTIONS' },
      body: JSON.stringify(rpcError(null, -32000, 'Use POST — este servidor MCP é stateless (sem stream SSE persistente)')),
    }
  }

  let payload
  try {
    payload = JSON.parse(event.body || '')
  } catch {
    return {
      statusCode: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify(rpcError(null, -32700, 'JSON inválido')),
    }
  }

  const messages = Array.isArray(payload) ? payload : [payload]
  const responses = (await Promise.all(messages.map(handleMessage))).filter(Boolean)

  // Payload era só notificações (ex.: notifications/initialized) → 202 sem body.
  if (responses.length === 0) {
    return { statusCode: 202, headers: CORS_HEADERS, body: '' }
  }

  // Em batch, responde com array; em mensagem única, com objeto simples.
  const body = Array.isArray(payload) ? responses : responses[0]

  // Responde em SSE quando o cliente pedir Accept: text/event-stream.
  // Clientes como o Claude Desktop e alguns clientes n8n mandam esse header.
  const accept = (event.headers?.accept || event.headers?.Accept || '').toLowerCase()
  if (accept.includes('text/event-stream')) {
    return {
      statusCode: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
      body: `event: message\ndata: ${JSON.stringify(body)}\n\n`,
    }
  }

  return {
    statusCode: 200,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}
