export const REFRESH_INTERVAL_MINUTES = 15

// Ordem, cores e tempo de tela iguais ao carrossel do Comando B2C
// (ver CAROUSEL em PekateDash.jsx e accentColor em config/pipedrive.js),
// pra manter os dois dashboards de TV consistentes.
// "Outros" é o catch-all pra campanhas que não batem com nenhum dos 5
// programas (ex: tag [SOLUÇÕES]) — sem cor equivalente no B2C, por isso
// usa um tom neutro e vai por último no carrossel.
// `matchToken` (opcional): filtro de segurança na aba de Performance da Laura —
// só entram na lista de anúncios (e nas somas de visualizações/leads do Meta)
// os anúncios cujo nome bate com esse token (normalizado: maiúsculo, sem
// acento/espaço/traço). Sem `matchToken`, nenhum filtro extra é aplicado
// (mostra tudo que o backend já agrupou pro program_id).
export const PROGRAMS = [
  { id: 'gecom', name: 'GECOM', accentColor: '#2DA8A8', duration: 20000 },
  { id: 'pos', name: 'Pós-Graduação', accentColor: '#F26522', duration: 30000 },
  { id: 'clevel', name: 'C-Level', accentColor: '#1E6CB6', duration: 20000, matchToken: 'CLEVEL' },
  { id: 'gef', name: 'GEF', accentColor: '#7B61FF', duration: 20000, matchToken: 'GEF' },
  { id: 'pdd', name: 'PDD', accentColor: '#E84393', duration: 20000 },
  { id: 'outros', name: 'Outros', accentColor: '#64748B', duration: 20000 },
]
