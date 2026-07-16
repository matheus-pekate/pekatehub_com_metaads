// ============================================================
// CONFIGURAÇÃO CENTRAL DO DASHBOARD
// Edite aqui para ajustar metas, datas, IDs e comportamento.
// ============================================================

export const PIPEDRIVE_BASE_URL = 'https://api.pipedrive.com'

export const PIPEDRIVE_COMPANY_DOMAIN = 'pekate'

export function buildPipedriveDealUrl(dealId) {
  return `https://${PIPEDRIVE_COMPANY_DOMAIN}.pipedrive.com/deal/${dealId}`
}

// Intervalo de atualização automática dos dados (em minutos)
export const REFRESH_INTERVAL_MINUTES = 30

export const PROGRAMS = [
  {
    id: 'pos',
    name: 'Pós-Graduação em Gestão',
    shortName: 'Pós-Gestão',
    startDate: '2026-08-24',
    goal: 40,
    price: 48900,
    revenueGoal: 1800000,
    pipelineId: 84,
    pipelineName: '2026 - FDC - Pós-Negócios (T12)',
    winStageId: 421, // Efetivado
    convertedFilter: {
      customField: 'ceb81f259b83cf46c12f4acc7dfdc8ac97d057a8', // Turma
      value: 528, // CPS-12
    },
    stages: [
      { id: 416, name: 'Cliente Potencial', sub: 'Entrada do funil' },
      { id: 417, name: 'Qualificado',       sub: 'SQL · briefing feito',       verb: 'qualificam' },
      { id: 418, name: 'Em Negociação',     sub: 'Proposta enviada',           verb: 'negociam' },
      { id: 419, name: 'Inscrito',          sub: 'Boleto / contrato',          verb: 'inscrevem' },
      { id: 420, name: 'Entrevista',        sub: 'Coordenação acadêmica',      verb: 'avançam' },
      { id: 421, name: 'Efetivado',         sub: 'Matriculado · contado na meta', verb: 'efetivam' },
    ],
    accentColor: '#F26522',
  },
  {
    id: 'gecom',
    name: 'Gestão Comercial',
    shortName: 'GECOM',
    startDate: '2026-06-15',
    goal: 30,
    price: 6150,
    revenueGoal: 184500,
    pipelineId: 78,
    pipelineName: 'FDC Abertos - Gestão Comercial (GECOM)',
    winStageId: 384, // Efetivado
    convertedFilter: {
      customField: 'ceb81f259b83cf46c12f4acc7dfdc8ac97d057a8', // Turma
      value: 524, // CPS-08
    },
    stages: [
      { id: 380, name: 'Cliente Potencial', sub: 'Entrada do funil' },
      { id: 381, name: 'Qualificado',       sub: 'SQL · briefing feito',       verb: 'qualificam' },
      { id: 382, name: 'Em Negociação',     sub: 'Proposta enviada',           verb: 'negociam' },
      { id: 383, name: 'Inscrito',          sub: 'Boleto / contrato',          verb: 'inscrevem' },
      { id: 384, name: 'Efetivado',         sub: 'Matriculado · contado na meta', verb: 'efetivam' },
    ],
    accentColor: '#2DA8A8',
  },
  {
    id: 'clevel',
    name: 'Jornada C-Level',
    shortName: 'C-Level',
    startDate: '2026-08-08',
    goal: 35,
    price: 33880,
    revenueGoal: 1185800,
    pipelineId: 42,
    pipelineName: 'FDC Abertos - Jornada C-Level (C-Level)',
    winStageId: 216, // Inscrito
    convertedFilter: {
      customField: 'ceb81f259b83cf46c12f4acc7dfdc8ac97d057a8', // Turma
      value: 520, // CPS-04
    },
    stages: [
      { id: 214, name: 'Cliente Potencial', sub: 'Entrada do funil' },
      { id: 215, name: 'Qualificado',       sub: 'SQL · briefing feito',       verb: 'qualificam' },
      { id: 217, name: 'Em Negociação',     sub: 'Proposta enviada',           verb: 'negociam' },
      { id: 216, name: 'Inscrito',          sub: 'Matriculado · contado na meta', verb: 'inscrevem' },
    ],
    accentColor: '#1E6CB6',
  },
  {
    id: 'gef',
    name: 'Gestão Econômica-Financeira',
    shortName: 'GEF',
    startDate: '2026-10-19',
    goal: 35,
    price: 8340,
    revenueGoal: 291900,
    pipelineId: 73,
    pipelineName: 'FDC Abertos - Gestão Financeira (GEF)',
    winStageId: 360, // Inscrito
    convertedFilter: {
      customField: 'ceb81f259b83cf46c12f4acc7dfdc8ac97d057a8', // Turma
      value: 521, // CPS-05
    },
    stages: [
      { id: 358, name: 'Cliente Potencial', sub: 'Entrada do funil' },
      { id: 357, name: 'Qualificado',       sub: 'SQL · briefing feito',           verb: 'qualificam' },
      { id: 359, name: 'Em Negociação',     sub: 'Proposta enviada',               verb: 'negociam' },
      { id: 360, name: 'Inscrito',          sub: 'Matriculado · contado na meta', verb: 'inscrevem' },
    ],
    accentColor: '#7B61FF',
  },
  {
    id: 'pdd',
    name: 'PDD Avulso',
    shortName: 'PDD',
    startDate: '2026-12-18',
    goal: 20,
    price: 23700,
    revenueGoal: 474000,
    pipelineId: 43,
    pipelineName: 'FDC - PDD Avulso (médias empresas)',
    winStageId: 221, // Efetivado
    wonThisYear: true,
    stages: [
      { id: 236, name: 'Cliente Potencial', sub: 'Entrada do funil' },
      { id: 218, name: 'Qualificado',       sub: 'SQL · briefing feito',            verb: 'qualificam' },
      { id: 219, name: 'Em Negociação',     sub: 'Proposta enviada',                verb: 'negociam' },
      { id: 220, name: 'Inscrito',          sub: 'Boleto / contrato',               verb: 'inscrevem' },
      { id: 221, name: 'Efetivado',         sub: 'Matriculado · contado na meta',   verb: 'efetivam' },
    ],
    accentColor: '#E84393',
  },
]

// ============================================================
// COMANDO B2B — PAEX, GE, Customizados e Consultoria
// Deals B2B carregam valor próprio (sem preço fixo de turma),
// por isso não há price/revenueGoal/convertedFilter aqui.
// ============================================================

export const PROGRAMS_B2B = [
  {
    id: 'paex',
    name: 'PAEX',
    pipelineId: 3,
    pipelineName: 'FDC ME - PAEX',
    accentColor: '#08373F',
    stages: [
      { id: 12,  name: 'Cliente potencial' },
      { id: 14,  name: 'Oportunidade Qualificada' },
      { id: 15,  name: 'Proposta Enviada' },
      { id: 202, name: 'Em Negociação' },
      { id: 342, name: 'Negócio - Stand-by' },
      { id: 16,  name: 'Negócio Provável' },
      { id: 201, name: 'Ficha Enviada' },
    ],
  },
  {
    id: 'ge',
    name: 'GE',
    pipelineId: 63,
    pipelineName: 'FDC - Programas GE',
    accentColor: '#2DA8A8',
    stages: [
      { id: 306, name: 'Cliente Potencial' },
      { id: 307, name: 'Oportunidade Qualificada' },
      { id: 308, name: 'Proposta Enviada' },
      { id: 309, name: 'Em Negociação' },
      { id: 310, name: 'Negócio Provável' },
      { id: 311, name: 'Ficha Enviada' },
    ],
  },
  {
    id: 'customizados',
    name: 'Customizados',
    pipelineId: 65,
    pipelineName: 'FDC ME - Customizados',
    accentColor: '#CB5B36',
    stages: [
      { id: 317, name: 'Cliente Potencial' },
      { id: 318, name: 'Oportunidade Qualificada' },
      { id: 319, name: 'Proposta Enviada' },
      { id: 320, name: 'Em Negociação' },
      { id: 343, name: 'Negócio - Stand-by' },
      { id: 321, name: 'Negócio Provável' },
      { id: 322, name: 'Ficha Enviada' },
    ],
  },
  {
    id: 'consultoria',
    name: 'Consultoria',
    pipelineId: 7,
    pipelineName: 'PKT - Consultorias',
    accentColor: '#7B61FF',
    stages: [
      { id: 37,  name: 'Cliente potencial' },
      { id: 38,  name: 'Contato Realizado' },
      { id: 39,  name: 'Oportunidade Qualificada' },
      { id: 40,  name: 'Proposta Enviada' },
      { id: 41,  name: 'Negócio Provável' },
      { id: 275, name: 'Assinatura de Contrato' },
    ],
  },
]

const B2B_YEAR_RANGE_START = 2024

export const B2B_YEAR_OPTIONS = (() => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let y = currentYear; y >= B2B_YEAR_RANGE_START; y--) years.push(y)
  return years
})()
