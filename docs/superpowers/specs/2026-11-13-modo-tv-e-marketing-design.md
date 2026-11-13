# Modo TV + ordem do Comando Marketing — design curto

## Intenção
A TV da Pekatê fica passando os comandos sozinha. Hoje o Comando Marketing para em programas
sem campanha ativa (tela vazia), e não existe um jeito de rodar B2C, B2B e Marketing em sequência.

## Objetivos
1. Marketing: programas sem campanha ativa ficam no **fim da faixa**, levemente apagados, clicáveis,
   e **fora da rotação automática**.
2. Botão **TV** no menu lateral do hub (`/tv`) roda em loop: B2C → B2B → Marketing → B2C...
3. Na TV só passa o que está "acontecendo":
   - **B2C:** turmas ainda não iniciadas (`startDate` >= hoje). Decidido pelo usuário. Auto-atualiza.
   - **B2B:** programas com ao menos 1 negócio aberto no ano atual (`totalOpenCount > 0`).
   - **Marketing:** programas com campanha ativa (`hasActiveCampaigns`).
4. Mesmas telas de hoje, com barra de topo e botão Home. Sem seletor de ano na TV.

## Não objetivos
- Não mexer no comportamento das rotas atuais (`/pekate-dash`, `/comando-b2b`, `/meta-ads`) fora da ordem do Marketing.
- Não duplicar telas nem dados.

## Abordagem (única que serve)
Reaproveitar as três telas. Um orquestrador `/tv` (`pages/TvMode.jsx`) chama os 3 hooks de dados uma vez
(`useDashboardData`, `useB2BDashboardData(anoAtual)`, `useMetaAdsData`) e monta a tela da fase atual.
As telas viram "inner components" que recebem os dados por prop (o B2C já é assim); a rota normal
continua chamando o hook sozinha. Cada tela aceita `tv={{ programIds, onCycleEnd }}`: o carrossel só
percorre `programIds` e, ao passar do último, chama `onCycleEnd` em vez de voltar ao começo.
Descartada: manter as 3 páginas montadas escondidas (refaz tudo em memória, fica pesado) e refazer
o fetch a cada troca de fase (chamadas desnecessárias ao Pipedrive/n8n).

## Detalhes decididos por mim (ajustáveis)
- Fase sem programas elegíveis é pulada. Se as três ficarem vazias, mostra aviso.
- Enquanto os dados da fase não carregaram, mostra a tela normal de carregamento; só pula depois de carregar.
- Marketing: ordem = ativos (na ordem atual) e depois inativos. `activeIdx` passa a seguir essa ordem.
- Fora da TV, o carrossel do Marketing também ignora os inativos, mas clicar neles funciona (pausa a rotação).
- Botão TV no fim da lista do menu lateral, ícone de monitor, abre direto `/tv`.

## Validação
Playwright com `/api/*` e webhooks simulados: ordem do Marketing, ciclo completo da TV, fase pulada e
screenshots antes de reportar. Sem deploy/merge sem confirmação (regra do CLAUDE.md).
