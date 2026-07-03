export const REFRESH_INTERVAL_MINUTES = 15

// Lista canônica dos programas — define a ordem fixa no grid, mesmo quando
// um programa não tem campanha ativa no momento (ex: GECOM, PDD).
// Campanhas com tag [SOLUÇÕES] ficam fora de propósito (ver plano do dashboard).
export const PROGRAMS = [
  { id: 'gef', name: 'GEF' },
  { id: 'clevel', name: 'C-Level' },
  { id: 'pos', name: 'Pós-Graduação' },
  { id: 'gecom', name: 'GECOM' },
  { id: 'pdd', name: 'PDD' },
]
