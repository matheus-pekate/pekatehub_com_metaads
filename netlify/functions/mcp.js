// Servidor MCP remoto (Streamable HTTP) que expõe os painéis Comando B2C e
// Comando B2B como tools, pra qualquer ferramenta que fale MCP (Claude,
// ChatGPT, n8n MCP Client, etc.) conseguir ler os dois painéis sob demanda.
//
// URL do servidor: https://pkt-hub.netlify.app/mcp
//
// Os números vêm de src/lib/comandoData.js — o mesmo módulo que o REST
// /api/comando usa, que por sua vez reusa a lógica de cálculo dos dashboards.
// Então MCP, REST e as telas nunca divergem.
//
// Autenticação: se a env var METAS_API_SECRET estiver configurada na Netlify,
// a chamada precisa trazer o segredo em um destes (nessa ordem de preferência):
//   - header "Authorization: Bearer <segredo>"
//   - header "x-metas-secret: <segredo>"
//   - query string "?secret=<segredo>" (útil porque muitos clientes MCP só
//     deixam colar uma URL, sem headers customizados)
// Sem essa env var, o endpoint fica aberto (mesma postura dos outros do hub).
import { loadB2C, loadB2B } from '../../src/lib/comandoData.js'

const SERVER_INFO = { name: 'pkt-hub-comando', version: '1.0.0', title: 'PKT-HUB — Comando B2C/B2B' }
const SUPPORTED_PROTOCOLS = ['2025-06-18', '2025-03-26', '2024-11-05']
const DEFAULT_PROTOCOL = '2025-06-18'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-metas-secret, mcp-protocol-version, mcp-session-id',
  'Access-Control-Expose-Headers': 'mcp-session-id, mcp-protocol-version',
  'Access-Control-Max-Age': '86400',
}

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
]

// Sem `detalhado`, corta alertas e vendedores: é muita coisa pra jogar na
// janela de contexto de um agente que só quer saber como está a meta.
function project(program, detalhado) {
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

async function runTool(name, args = {}) {
  const detalhado = args.detalhado === true

  if (name === 'comando_b2c') {
    const { programs } = await loadB2C()
    return {
      painel: 'Comando B2C',
      generatedAt: new Date().toISOString(),
      programs: programs.map((p) => project(p, detalhado)),
    }
  }

  if (name === 'comando_b2b') {
    const year = Number.isInteger(args.year) ? args.year : new Date().getFullYear()
    const result = await loadB2B(year)
    return {
      painel: 'Comando B2B',
      generatedAt: new Date().toISOString(),
      year: result.year,
      programs: result.programs.map((p) => project(p, detalhado)),
    }
  }

  return null
}

function rpcResult(id, result) {
  return { jsonrpc: '2.0', id, result }
}

function rpcError(id, code, message) {
  return { jsonrpc: '2.0', id: id ?? null, error: { code, message } }
}

async function handleMessage(msg) {
  if (!msg || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') {
    return rpcError(msg?.id, -32600, 'Requisição JSON-RPC inválida')
  }

  const { id, method, params } = msg
  const isNotification = id === undefined || id === null

  switch (method) {
    case 'initialize': {
      const requested = params?.protocolVersion
      const protocolVersion = SUPPORTED_PROTOCOLS.includes(requested) ? requested : DEFAULT_PROTOCOL
      return rpcResult(id, {
        protocolVersion,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions:
          'Duas tools que leem os painéis de vendas da Pekatê Brasil direto do Pipedrive: ' +
          'comando_b2c (matrículas e metas dos programas) e comando_b2b (negócios corporativos). ' +
          'Chame com detalhado=true quando precisar citar negócios ou vendedores específicos. ' +
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
        // Erro de execução da tool vai como resultado com isError, não como
        // erro de protocolo — assim o agente consegue ler a mensagem e reagir.
        return rpcResult(id, {
          content: [{ type: 'text', text: `Erro ao consultar o painel ${toolName}: ${err.message}` }],
          isError: true,
        })
      }
    }

    default:
      if (isNotification) return null // notifications/initialized e afins: só ignora
      return rpcError(id, -32601, `Método não suportado: ${method}`)
  }
}

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

export const handler = async (event) => {
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

  // Este servidor é stateless: não mantém sessão SSE aberta, então GET (o
  // canal server→client do Streamable HTTP) não tem o que entregar.
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json', Allow: 'POST, OPTIONS' },
      body: JSON.stringify(rpcError(null, -32000, 'Use POST — este servidor MCP é stateless (sem stream SSE do servidor)')),
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

  // Só notificações no lote (ex.: notifications/initialized) → nada a responder.
  if (responses.length === 0) {
    return { statusCode: 202, headers: CORS_HEADERS, body: '' }
  }

  const body = Array.isArray(payload) ? responses : responses[0]

  // Streamable HTTP aceita resposta única em JSON ou em SSE. Alguns clientes
  // só aceitam o que pediram no Accept, então respondemos no formato pedido.
  const accept = event.headers?.accept || event.headers?.Accept || ''
  if (accept.includes('text/event-stream')) {
    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
      body: `event: message\ndata: ${JSON.stringify(body)}\n\n`,
    }
  }

  return {
    statusCode: 200,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}
