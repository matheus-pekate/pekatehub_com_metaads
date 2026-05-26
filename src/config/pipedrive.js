// ============================================================
// CONFIGURAÇÃO CENTRAL DO DASHBOARD
// Edite aqui para ajustar metas, datas, IDs e comportamento.
// ============================================================

export const PIPEDRIVE_BASE_URL = 'https://api.pipedrive.com'

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
    winStageId: 421, // Efetivado
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
]
