# Dashboard Comercial B2C — Pekate Brasil

Dashboard interno para acompanhamento das metas e funis dos programas B2C (Pós-Gestão, GECOM, GEF), alimentado pela API do Pipedrive.

## Pré-requisitos

- Node.js 18+ instalado
- Token de API do Pipedrive

## Como rodar

### 1. Instalar dependências

```bash
cd pipedrive-dashboard
npm install
```

### 2. Configurar o token

Crie um arquivo `.env` na raiz do projeto:

```bash
cp .env.example .env
```

Edite o `.env` e substitua pelo seu token real:

```
VITE_PIPEDRIVE_TOKEN=seu_token_aqui
```

> O token está em: Pipedrive → Configurações → Preferências pessoais → API

### 3. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:3000` no navegador.

---

## Personalização

Todas as configurações ficam em `src/config/pipedrive.js`:

| Configuração | O que faz |
|---|---|
| `REFRESH_INTERVAL_MINUTES` | Intervalo de atualização automática |
| `goal` em cada programa | Meta de conversões por turma |
| `startDate` | Data de início de cada programa |
| `winStageId` | ID do estágio que representa conversão |

---

## Estrutura do projeto

```
src/
├── config/pipedrive.js       ← configurações e IDs
├── services/pipedriveApi.js  ← chamadas à API
├── hooks/useDashboardData.js ← lógica de dados e refresh
├── components/               ← componentes visuais
└── pages/Dashboard.jsx       ← layout principal
```

---

## Dados exibidos

- **Bloco 1** — Cards com progresso de meta por programa (clicável)
- **Bloco 2** — Funil de estágios + tabela de deals ativos do programa selecionado
- **Bloco 3** — Performance individual dos vendedores no programa selecionado
