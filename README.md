# PKT-HUB — Pekatê Brasil

Hub de dados e inteligência comercial da Pekatê Brasil, alimentado em tempo real pela API do Pipedrive.

## Visão geral

O PKT-HUB centraliza a análise de performance do time comercial B2C em um único ponto de acesso. Três módulos principais compõem a plataforma:

| Módulo | Rota | Descrição |
|---|---|---|
| **Hub** | `/pkt-hub` | Ponto de entrada com navegação para os módulos |
| **Análise Individual** | `/seller-analysis` | Análise profunda de um vendedor: KPIs, atividade, velocidade de funil, carteira ativa, deals e insights inteligentes |
| **Ranking Comparativo** | `/seller-ranking` | Visão lado a lado de todos os vendedores com pódio, radar multidimensional, gráficos comparativos e tabela detalhada |
| **Pekatê Dash** | `/pekate-dash` | Dashboard executivo com cards de programa, funis, alertas e relatório semanal |
| **Dashboard legado** | `/` | Visão original de metas por programa |

## Stack

- **React 18** + Vite 5
- **React Router v6** — roteamento SPA
- **Recharts** — gráficos (AreaChart, PieChart, BarChart, RadarChart)
- **Pipedrive API** — v2 (deals com cursor) + v1 (users, activities, deal details)
- **CSS modules** — sem framework CSS, estilização manual por página
- **Lottie React** — animações pontuais

## Pré-requisitos

- Node.js 18+
- Token de API do Pipedrive

## Como rodar

```bash
# 1. Instalar dependências
npm install

# 2. Configurar o token
cp .env.example .env
# Edite .env e insira seu token real:
# VITE_PIPEDRIVE_TOKEN=seu_token_aqui

# 3. Iniciar o servidor
npm run dev
```

O app sobe em `http://localhost:5173`.

> O token do Pipedrive fica em: **Pipedrive > Configurações > Preferências pessoais > API**

## Estrutura do projeto

```
src/
├── config/
│   └── pipedrive.js            # Programas, metas, IDs de pipeline e stages
├── services/
│   ├── pipedriveApi.js          # Chamadas à API do Pipedrive (v1 + v2)
│   └── claudeApi.js             # Integração com Claude (relatórios)
├── hooks/
│   ├── useDashboardData.js      # Dados do dashboard legado
│   ├── useSellerData.js         # Métricas individuais por vendedor
│   ├── useSellerInsights.js     # Engine de insights inteligentes (11 regras)
│   ├── useRankingData.js        # Métricas comparativas de todos os vendedores
│   └── useReportData.js         # Dados para relatório semanal
├── pages/
│   ├── PktHub.jsx               # Hub central de navegação
│   ├── SellerAnalysis.jsx       # Análise individual B2C
│   ├── SellerRanking.jsx        # Ranking comparativo B2C
│   ├── PekateDash.jsx           # Dashboard executivo
│   └── Dashboard.jsx            # Dashboard legado
├── components/
│   ├── pekate-dash/             # Componentes do dashboard executivo
│   ├── charts/                  # Componentes de gráficos
│   └── layout/                  # Header e layout compartilhado
└── main.jsx                     # Entry point + rotas
```

## Configuração

Todas as configurações de negócio ficam em `src/config/pipedrive.js`:

| Configuração | Descrição |
|---|---|
| `PROGRAMS` | Lista de programas com pipeline ID, stages, metas e preço |
| `REFRESH_INTERVAL_MINUTES` | Intervalo de refresh automático |
| `goal` | Meta de conversões por programa |
| `revenueGoal` | Meta de receita por programa |
| `stages` | Etapas do funil com IDs do Pipedrive |
| `convertedFilter` | Filtro de turma via custom field (quando aplicável) |

## Módulos em detalhe

### Análise Individual (`/seller-analysis`)

- **Filtros**: Vendedor, Programa, Período
- **KPIs**: Conversão, Receita, Taxa de conversão, Carteira ativa
- **Atividade**: Volume diário (area chart), mix por canal, cadência por lead
- **Velocidade do funil**: Tempo médio de conversão, tempo por stage, gargalos, deals estagnados
- **Carteira ativa**: Distribuição por stage (donut chart), pipeline por stage (bar chart)
- **Deals**: Tabela paginada com filtros (abertos, won, lost, estagnados), busca e ordenação
- **Sidebar "A revisar"**: Insights gerados automaticamente por uma engine de 11 regras (zero API calls), com cards clicáveis que scrollam e destacam a seção relevante

### Ranking Comparativo (`/seller-ranking`)

- **Pódio**: Layout dark com spotlight, coroa no 1º, avatares com badge, pedestais proporcionais
- **Radar chart**: Perfil multidimensional (receita, conversões, taxa, atividades, pipeline, cadência)
- **Gráficos de KPI**: Receita, conversões won/lost, taxa de conversão, ticket médio
- **Atividade**: Comparativo por canal (stacked bars), velocidade de conversão
- **Tabela detalhada**: 15 métricas lado a lado + média do time

### Engine de Insights

O hook `useSellerInsights` gera alertas a partir de métricas existentes, sem chamadas extras à API:

| Severidade | Exemplos |
|---|---|
| **Critical** | Leads sem contato >7d, deals parados >14d |
| **Warning** | Queda na taxa de conversão, zero e-mails, gargalo de velocidade, inatividade recente, queda de receita |
| **Opportunity** | Deals em stages avançados prontos para follow-up |
| **Insight** | Projeção de meta, cadência abaixo do time, conversão mais lenta |

## Programas configurados

| Programa | Pipeline | Stages | Meta |
|---|---|---|---|
| Pós-Gestão | 84 | 6 etapas (até Efetivado) | 40 conversões |
| GECOM | 78 | 5 etapas (até Efetivado) | 30 conversões |
| C-Level | 42 | 4 etapas (até Inscrito) | 35 conversões |
| GEF | 73 | 4 etapas (até Inscrito) | 35 conversões |

## Build para produção

```bash
npm run build    # Gera /dist
npm run preview  # Preview local do build
```

---

Desenvolvido para **Pekatê Brasil**.
