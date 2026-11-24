# Changelog

Todas as mudanças relevantes do Evully. Formato baseado em
[Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/); versões seguem
[SemVer](https://semver.org/lang/pt-BR/) alinhado ao roadmap (`0.1.0` = V0.1).

## [Unreleased]

V1.3, Recommendation Engine (1.3.0-alpha.1: o motor, a tela Sinais e as
primeiras regras).

- **Sinais**, nova tela no menu: avisos calculados a partir dos registros,
  cada um com "Por que estou vendo isso?" (os números, a regra e a versão),
  um atalho para registrar e as opções "Lembrar em 7 dias" e "Dispensar";
  o histórico mostra o que foi dispensado, adiado ou resolvido;
- primeiras regras: **pesagem ausente** (7 dias), **medidas ausentes** (21
  dias, para quem acompanha medidas) e **progressão dupla** (exercício dos
  planos ativos que atingiu o critério para aumentar a carga, só com carga);
- um sinal aberto não se repete, um adiado volta na data, um dispensado
  fica quieto por 14 dias e o que deixou de valer fica como resolvido;
  nenhum sinal muda os seus dados;
- card **Sinais** no Dashboard com até 3 sinais abertos, e a aba **Sinais**
  em Configurações para ligar ou desligar cada regra;
- banco: tabelas `recommendation_events` e `recommendation_decisions`
  (migration 0019), incluídas no backup, na exportação e na transferência
  de perfil.

- roadmap da V1.3: sinais com regra e versão, os números de origem no
  próprio sinal (sem `analytics_snapshots`), limites fixos e versionados,
  tela Sinais e card no Dashboard, faixa de ritmo opcional no projeto;
  exames ficam para a V1.5.

## [1.2.0] - 2026-11-21

V1.2, Analytics Engine: Progresso compara este período com o anterior em
todos os módulos, com números calculados só a partir dos seus registros.

- **Comparar períodos** no topo de Progresso: os últimos 7, 15, 30 ou 60
  dias contra o mesmo número de dias antes deles, em seções:
  - **Corpo:** dias com pesagem, peso médio, média móvel, a variação e o
    ritmo por semana, e cada medida com o último valor e a variação, nas
    cores da direção do objetivo;
  - **Treino:** treinos, aderência ao plano, séries concluídas e volume;
  - **Alimentação:** calorias, proteína, carboidratos e gorduras por dia,
    com o % da meta, e peso × calorias lado a lado;
  - **Sono e atividade:** sono por noite, cardio, cardio por semana e
    passos por dia;
- **Treino nos últimos N dias:** recordes medidos (carga maior ou mais
  repetições com uma carga já usada, com a marca anterior) e séries, volume
  e treinos por grupo muscular;
- **Hábitos nos últimos N dias:** dias cumpridos de cada hábito;
- **Sem estimativas:** sem 1RM, TMB ou percentual de gordura; sem registros
  suficientes aparece "—", nunca zero. Cada cálculo tem método e versão e é
  feito na hora, sem tabela nova;
- novo componente `SegmentedControl`, também usado no seletor de período
  de Progresso e do gráfico de peso;
- os dados de treino e de nutrição que chegam às telas ganharam grupo
  muscular, séries concluídas, carboidratos, gorduras e as metas deles, e os
  planos trazem a data de criação; sem mudança no banco.

## [1.1.0] - 2026-11-19

V1.1, design system: o mesmo Evully com um visual novo e consistente em
todas as telas, nos temas claro e escuro.

- **Visual:** novo logo, ícone do app, tipografia, sombras, cabeçalho de tela
  e menu revistos; Dashboard reorganizado com gráfico de peso, card "Hoje" e
  "Próximo treino";
- **Componentes:** avisos, selos, tabelas, caixas de seleção, interruptores,
  dicas nos botões de ícone, carregando e "Mostrar mais" nos históricos
  longos;
- **Ilustrações** próprias nos estados vazios, na criação de perfil, no
  questionário, na recuperação e na tela de erro;
- **Acessibilidade:** foco visível em todas as abas e diálogos que devolvem
  o foco ao fechar, conferidos por testes em todas as telas e nos dois temas;
- **Correção:** a verificação da assinatura das atualizações fecha o
  instalador antes de seguir.

### Design system (V1.1 — ilustrações)

- Ilustrações próprias no estilo "selo da marca"
  ([DESIGN.md](DESIGN.md), §4.3), em `packages/ui/src/illustrations/`:
  estados vazios de Sono,
  Treinos, Peso, Medidas, Favoritas, Alimentos, Cardio e Hábitos, criação
  de perfil, primeiro passo do questionário, recuperação e erro; todas no
  catálogo.
- `EmptyState` aceita `illustration` e `title`; os textos dos estados
  vazios explicam o primeiro registro.

### Correções

- A verificação da assinatura das atualizações só termina depois de
  fechar o instalador; antes, no Windows, o arquivo ainda aberto podia
  impedir apagar, regravar ou executar o instalador logo em seguida (era a
  causa das falhas intermitentes do teste no CI).

### Design system (V1.1 — ícones e tokens para o mobile)

- Componente `Icon` ([DESIGN.md](DESIGN.md), §4.2): três tamanhos (16, 20 e 24 px) e
  traço de 2 px; todos os ícones das telas passam por ele, e o
  `npm run lint` falha com ícone desenhado direto.
- Um ícone fixo por módulo em `MODULES`, que também monta o menu.
- O build dos tokens gera o preset do NativeWind
  (`@evully/tokens/nativewind-preset`) com cores e sombras dos dois temas,
  tipografia, raios e fonte, para o app mobile (V2.1).

### Design system (V1.1, fase 5 — validação)

- Relatório em `docs/design/V1.1_VALIDATION.md`.
- Novo teste ponta a ponta (`design.spec.ts`): todas as telas e abas em
  1024 e 1920 px, nos dois temas, sem rolagem lateral, com nome acessível
  em todo controle e anel de foco em toda parada do Tab; diálogo devolve
  o foco ao fechar.
- `npm run lint` também falha com cores fora dos tokens
  (`scripts/check-colors.mjs`).
- Painel das abas com anel de foco; a lista de abas não vira mais uma
  parada invisível do Tab depois de um clique.
- Diálogos devolvem o foco ao elemento que os abriu.
- Novo token `overlay` para o fundo dos diálogos.
- Componentes de `packages/ui` na escala de tipografia.

### Design system (V1.1, fase 4 — demais telas)

- Históricos de Peso, Medidas e Sono mostram os 30 registros mais
  recentes e o Cardio as 8 últimas semanas, com "Mostrar mais"
  (`useShowMore` e `ShowMoreButton` em `packages/ui`); os dados não mudam.
- Hábitos e Configurações usam a largura de conteúdo; o dia dos Hábitos
  mostra a data por extenso em Hoje.
- Botões só de ícone de Sono e Cardio com tooltip (`IconButton`); os
  seletores de Progresso usam `NativeSelect`.
- Peso, Medidas, Progresso, Cardio, Sono, Hábitos, Perfis, Configurações,
  importação e o shell usam a escala de tipografia.

### Design system (V1.1, fase 4 — Treinos e Nutrição)

- Treinos e Nutrição usam a escala de tipografia (`caption`, `body`,
  `heading`) no lugar de `text-sm`, `text-xs` e `text-base`.
- Treinar ocupa a largura de conteúdo como as outras abas; dias e planos
  em até 3 colunas.
- Formulário de exercício com os campos alinhados pela base.
- Seletor de dia da Nutrição mostra a data por extenso em Hoje, Ontem e
  Amanhã; "Adicionar" água é um botão secundário.
- Ícone do Evully na janela também em desenvolvimento (antes, o do
  Electron).
- Seed de demonstração responde os questionários de Treinos e Nutrição.

### Design system (V1.1, fase 3)

- Dashboard reorganizado (DESIGN.md §5.1): data de hoje no cabeçalho,
  indicadores, gráfico de peso ao lado do card "Hoje", card próprio
  "Próximo treino", projeto, últimos 14 dias e hábitos, cardio e sono.
- "Dados insuficientes" aparece em tamanho de título e cor secundária,
  não mais em tamanho de métrica.
- Esqueleto de carregamento no formato dos indicadores.
- Eixo do gráfico de peso com até uma casa decimal, sem rótulos repetidos.
- `cn` conhece a escala de tipografia do Evully: `text-heading` e afins
  não anulam mais a cor do texto ao combinar classes.

### Design system (V1.1, fase 2)

- Novos componentes em `packages/ui`: `Badge`, `Alert`, `Checkbox`,
  `Switch`, `Table`, `Skeleton`, `Tooltip` e `IconButton` (com tooltip);
  `Button` ganhou o estado `busy`. `TrendBadge` passa a se chamar
  `TrendIndicator`, como no DESIGN.md.
- As telas usam os componentes novos: avisos de atualização, de backup e de
  erro; tabelas de histórico e da prévia de importação; caixas de seleção
  de hábitos, refeições, séries e medidas; o backup automático virou um
  interruptor.
- Novo tom `danger-soft` nos tokens, com contraste verificado.
- Catálogo de componentes interno (`/dev/catalog`), só em desenvolvimento,
  com todos os tokens e componentes nos dois temas.
- Dependência nova: `@radix-ui/react-tooltip` (MIT).

### Design system (V1.1, fase 1)

- Tipografia, sombras e larguras de layout viraram tokens
  (`packages/tokens/tokens.json`); as telas usam `text-title`, `text-body`
  e os demais tamanhos da escala no lugar de tamanhos soltos. Os títulos de
  tela passam de 26 px para 24 px, como no [DESIGN.md](DESIGN.md), §3.2.
- Cabeçalho de tela padrão (`ScreenHeader`) com título, descrição e ações.
- Conteúdo com largura máxima de 1200 px; barra lateral fixa ao rolar, com
  estados de hover e foco visíveis nos itens do menu.
- Menu: "Dieta" passa a se chamar **Nutrição** e "Estatísticas",
  **Progresso**.
- Nova marca do Evully em SVG: um coração com pulso (bem-estar), uma folha
  (nutrição) e um halter (treino). O instalador, a janela e a barra de tarefas
  passam a usar esse ícone no lugar do ícone padrão do Electron.
- Cartões com sombra suave no tema claro; no escuro, a elevação vem da
  superfície.

### Roadmap

- Nova V1.1: design system (ilustrações SVG próprias, ícones, imagens e
  acabamento visual); Analytics, Recomendações, Lembretes, Health e Coach AI
  passam para V1.2 a V1.6 (README §4, §15.3).
- Decidido: os apps Android e iPhone vêm antes do app web. Depois das V1.1 a
  V1.6: V2.0 servidor, conta e sincronização; V2.1 Android na Google Play;
  V2.2 iPhone na App Store; V2.3 app web e site (README §4).

## [1.0.0] - 2026-11-16

Primeira versão estável do Evully: fim da Fase 1 (desktop). Reúne tudo desde
a 0.1.0:

- **Perfis e acompanhamento:** vários perfis no mesmo computador, questionário
  que monta o acompanhamento de cada um, projetos com prazo;
- **Corpo:** peso com tendência de 7 dias, medidas, gráficos e importação de
  CSV;
- **Nutrição:** catálogo de alimentos da casa, refeições, favoritas, água e
  metas que você define;
- **Treino:** biblioteca de exercícios, planos, execução com séries, cargas,
  repetições e RIR, histórico e sugestão simples de progressão;
- **Cardio, hábitos e sono**, com metas e indicadores;
- **Estatísticas** e painel com o resumo dos últimos 14 dias;
- **Seus dados:** backup manual e automático, restauração, exportação JSON e
  CSV, transferência de perfil entre computadores e recuperação se o arquivo
  de dados for danificado;
- **Atualização automática** assinada, acessibilidade (contraste WCAG AA,
  teclado e leitores de tela) e todos os critérios de aceite cobertos por
  testes ponta a ponta.

## [1.0.0-rc.1] - 2026-11-16

Versão candidata da 1.0.0, sem novidades: a mesma 1.0.0-alpha.2, para uso
diário antes da versão estável. Daqui até a 1.0.0 entram só correções.

## [1.0.0-alpha.2] - 2026-11-16

### Robustez (V1.0)

- Se o arquivo de dados estiver danificado (por exemplo depois de uma queda
  de energia), o Evully abre uma tela de recuperação em vez de falhar:
  lista os backups válidos e restaura o escolhido. O arquivo danificado é
  guardado como `evully-danificado-…db` e nunca é apagado.
- "Abrir pasta de logs" em Configurações › Sobre e na tela de recuperação.

## [1.0.0-alpha.1] - 2026-11-16

### Aceite da Fase 1 (V1.0)

- Testes ponta a ponta para todos os critérios do README §19: plano de
  treino próprio, histórico e sugestão de progressão, macros contra as metas,
  backup manual e restauração (16 fluxos no total).
- Nos testes, as janelas de abrir e salvar arquivo começam canceladas: nada é
  gravado fora da pasta temporária de cada teste.
- Decidido: o instalador segue sem assinatura de código (Authenticode) na
  Fase 1 (README §33).

## [0.8.0] - 2026-11-15

Versão estável da V0.8 (UX e polimento). Traz:

- **Acessibilidade:** contraste WCAG AA nos dois temas (verificado em
  `npm test`), lint de acessibilidade, "Pular para o conteúdo", foco no
  conteúdo ao trocar de tela, descrição em texto dos gráficos e nomes
  corretos nos campos para leitores de tela;
- **Consistência:** aviso único quando dados não carregam, com "Tentar de
  novo", e estados vazios com o mesmo visual;
- **Uso diário:** marcar hábito, série, alimento, refeição e backup
  automático responde na hora; do Dashboard ao peso salvo só com o teclado;
- **Qualidade:** testes ponta a ponta com Playwright no app real, em todo
  PR, e as fronteiras de arquitetura do desktop garantidas pelo lint.

## [0.8.0-alpha.4] - 2026-11-15

### Polimento (V0.8)

- "Registrar peso" e "Registrar medidas" no Dashboard abrem a tela com o
  cursor no campo: abrir, digitar e apertar Enter. Editar um registro
  também já coloca o cursor no campo.
- Ao trocar de tela pelo menu, o foco vai para o conteúdo e o leitor de tela
  anuncia a tela nova.
- Campos de medida têm nome curto ("Cintura"); o "como medir" é lido como
  descrição.
- DESIGN.md: a confirmação de ações é no próprio formulário (sem toasts).

## [0.8.0-alpha.3] - 2026-11-14

### Ajustes do uso real (V0.8)

- Marcar hábito, série concluída, alimento consumido, refeição inteira e
  backup automático responde na hora, sem a caixa piscar, e mantém o foco
  do teclado; se a gravação falhar, volta ao estado anterior com a mensagem.

## [0.8.0-alpha.2] - 2026-11-12

### Testes ponta a ponta (V0.8)

- 11 fluxos com Playwright no app real (`npm run e2e`), também no CI:
  perfil e questionário, peso, medidas, importação de CSV, isolamento entre
  perfis, persistência com backup ao fechar, refeição, treino, cardio,
  hábito, sono, Estatísticas, exportação JSON, transferência de perfil e o
  atalho "Pular para o conteúdo".
- Leitores de tela leem "Nascimento opcional" em vez de "Nascimentoopcional"
  nos campos opcionais.

### Arquitetura

- O lint passa a aplicar a fronteira de `application/` e `ports/` dos
  módulos do desktop (ARCHITECTURE.md §8); os schemas do arquivo de
  transferência de perfil foram para `packages/contracts`.
- Fim do import circular entre o editor de dia de treino e a linha de
  exercício do plano (`IconButton` em arquivo próprio).

## [0.8.0-alpha.1] - 2026-11-11

### Acessibilidade e consistência (V0.8)

- Cores do tema claro (neutro, perigo, positivo e atenção) um pouco mais
  escuras: todo texto atinge o contraste WCAG AA nos dois temas, verificado
  em `npm test`.
- "Pular para o conteúdo" no início de cada tela e foco visível nos itens
  de menu.
- Gráficos descrevem para leitores de tela o primeiro e o último valor.
- Aviso único quando dados não carregam, com "Tentar de novo".
- Estados vazios com o mesmo visual em todas as listas e gráficos.
- Lint de acessibilidade (`eslint-plugin-jsx-a11y`).
- Ferramentas de lint com `minimatch` 11.0.8 (alerta GHSA-g3hv-75wg-m249).
  O electron-builder ainda exige a 10.x; ela roda só no build, com os
  padrões de arquivo do próprio projeto.

## [0.7.0] - 2026-11-10

Versão estável da V0.7 (Backup, restauração e exportação). Traz:

- **Restaurar backup** em Configurações › Geral e backup, com validação do
  arquivo e backup do estado atual antes;
- **Exportar dados** do perfil atual em JSON completo ou em planilhas CSV
  no formato do Excel;
- **Transferir perfil** entre computadores, com resumo antes de importar e
  backup antes de substituir.

Detalhes de cada etapa nas pré-versões abaixo.

## [0.7.0-alpha.3] - 2026-11-10

### Added
- **Transferir perfil** entre computadores:
  - em Configurações › Perfil, "Exportar perfil" gera um arquivo zip;
  - "Importar perfil" fica nessa mesma tela, na seleção de perfis e na
    criação do primeiro perfil;
  - antes de gravar, o Evully confere o arquivo e mostra um resumo;
  - se o perfil já existe, você escolhe substituir (com backup antes) ou
    cancelar.

## [0.7.0-alpha.2] - 2026-11-10

### Added
- **Exportar dados** em Configurações › Perfil, só do perfil atual:
  - **JSON** completo, com todos os registros do perfil;
  - **CSV** num zip, uma planilha por categoria (pesos, medidas, treinos,
    séries, alimentação, água, sono, cardio e hábitos) no formato do Excel;
    pesos e medidas podem ser importados de volta.

## [0.7.0-alpha.1] - 2026-11-10

### Added
- **Restaurar backup** em Configurações › Geral e backup: escolha um backup
  das pastas de backup ou um arquivo, confira data, versão e perfis, e
  confirme. O Evully valida o arquivo, faz um backup do estado atual e
  reinicia para concluir.

### Removed
- O passo a passo de restauração manual em Configurações › Sobre.

## [0.6.0] - 2026-11-09

Versão estável da V0.6 (Estatísticas e dashboard completo). Traz:

- o card **Hoje** no painel, com calorias, proteína, água, passos, sono e o
  treino do dia, além da meta de sono;
- a tela **Estatísticas**, com gráficos de peso, medidas, calorias,
  proteína, sono, treino, cardio e passos, filtrados por período;
- o resumo dos **últimos 14 dias** no painel.

Detalhes de cada etapa nas pré-versões abaixo.

## [0.6.0-alpha.4] - 2026-11-04

### Added
- **Últimos 14 dias** no painel: variação do peso médio por semana, cintura,
  treinos concluídos sobre os planejados, proteína e sono médios e
  performance (volume de treino comparado aos 14 dias anteriores). Cada
  linha só aparece com dados suficientes.

### Fixed
- O card Hoje mostra o treino do dia como concluído depois de finalizado, em
  vez de oferecer começar de novo.

## [0.6.0-alpha.3] - 2026-11-03

### Added
- **Estatísticas de treino, cardio e passos:** volume e frequência de treino
  por semana, carga por exercício, minutos de cardio por semana contra a
  meta e passos por dia contra a meta do hábito.

### Fixed
- Em Estatísticas, medidas e média semanal com um único registro agora
  aparecem no gráfico.

## [0.6.0-alpha.2] - 2026-10-29

### Added
- **Tela Estatísticas** (menu › Estatísticas), com período de 30 dias,
  90 dias, projeto ou tudo: peso do dia e média móvel, média semanal do
  peso, velocidade de mudança (kg/semana), medidas (uma por vez), calorias
  e proteína consumidas contra a meta de cada dia e duração do sono contra
  a meta.

## [0.6.0-alpha.1] - 2026-10-28

### Added
- **Card "Hoje" no painel**: calorias, proteína e água, hábitos de
  quantidade com meta (como passos), o sono da última noite contra a meta e
  o treino do dia pelos planos ativos, com **Começar treino** (ou
  **Continuar treino** com um treino aberto). Substitui o card de nutrição.
- **Meta de sono por noite** na tela de Sono (Indicadores › Definir meta),
  guardada como histórico a partir de hoje.

## [0.5.0] - 2026-10-28

Versão estável da V0.5 — Sono: registro de noites (deitou, dormiu, acordou,
qualidade e notas), indicadores de 7 e 30 dias, horários médios e
consistência, e card de sono no painel inicial. Também traz a atualização
automática: o Evully procura versões novas ao abrir e pelo botão, e instala
ao fechar ou em "Reiniciar e atualizar". Detalhes de cada etapa nas
pré-versões abaixo.

## [0.5.0-alpha.6] - 2026-10-27

### Changed
- O log técnico registra cada busca de atualização (ao abrir ou pelo botão)
  e o resultado, e guarda só a primeira linha das mensagens de erro.

## [0.5.0-alpha.5] - 2026-10-27

### Changed
- Atualização automática: o Evully procura versões novas só ao abrir e no
  botão "Verificar atualizações" (sem verificação a cada 4 horas). Uma
  versão já baixada e verificada é instalada ao fechar o app, depois do
  backup de fechamento.

## [0.5.0-alpha.4] - 2026-10-27

### Changed
- Versão de teste do ciclo de atualização automática: primeira entregue
  pelo próprio app, sem instalação manual.

## [0.5.0-alpha.3] - 2026-10-27

### Added
- **Atualização automática**: o Evully procura versões novas ao abrir e a
  cada 4 horas, baixa em segundo plano e mostra **"Nova versão pronta ·
  Reiniciar e atualizar"**. Só instala quando você clica, depois do backup
  de fechamento. Em Configurações › Sobre: status, **Verificar
  atualizações** e o canal (pré-versões ou só estáveis).
- Cada atualização é conferida com uma assinatura digital própria antes de
  ser instalada.

## [0.5.0-alpha.2] - 2026-10-27

### Added
- **Indicadores de sono** na tela Sono: médias de 7 e 30 dias (com o
  número de noites), horário médio de dormir e de acordar, e consistência
  (variação média dos horários em 30 dias).
- **Painel inicial**: card **Sono** com a última noite e a média de 7 dias,
  só para quem registra sono.

## [0.5.0-alpha.1] - 2026-10-27

### Added
- **Sono** no menu (V0.5): registrar a noite com horário de deitar, de
  dormir (opcional) e de acordar, com o total calculado, qualidade de 1 a 5
  e notas. A noite pertence ao dia em que você acorda; uma noite por dia,
  com atalho para editar a que já existe. Histórico com editar e excluir.

### Changed
- "Adicionar exemplos" dos hábitos não cria mais "Horário de dormir"; o
  módulo de sono cobre esse dado. Quem já tem o hábito continua com ele.
- O teste de exclusão definitiva de perfil passa a cobrir o sono.

## [0.4.0] - 2026-10-27

Versão estável da V0.4 — Cardio e hábitos: registro de cardio com resumo
semanal e meta semanal, hábitos genéricos com registro diário e últimos
7 dias, e cards de hábitos e cardio no painel inicial. Detalhes de cada
etapa nas pré-versões abaixo.

### Changed
- O teste de exclusão definitiva de perfil passa a cobrir cardio, metas de
  cardio e hábitos.

## [0.4.0-alpha.4] - 2026-10-26

### Security
- Electron atualizado de 44.6.0 para 44.9.3, que corrige a confiança em
  certificados intermediários comprometidos da eMudhra
  (GHSA-jr5w-w6x2-84p9).

## [0.4.0-alpha.3] - 2026-10-26

### Added
- **Meta semanal de cardio**: sessões e/ou minutos por semana, definidos
  no card **Esta semana** do Cardio, com barras de progresso. Mudar a meta
  vale a partir de hoje; deixar os dois campos vazios remove a meta.
- **Painel inicial**: cards **Hábitos de hoje** e **Cardio da semana**,
  que só aparecem para quem usa cada módulo.

### Changed
- O teste de exclusão definitiva de perfil passa a cobrir as metas de cardio.

## [0.4.0-alpha.2] - 2026-10-26

### Added
- **Hábitos** no menu (V0.4): hábitos de sim/não, quantidade (com unidade
  e meta), duração (com meta) e horário. Aba **Dia** com um campo por
  hábito, salvo automaticamente, e os últimos 7 dias; aba **Gerenciar**
  para criar, editar, reordenar e desativar.
- **Adicionar exemplos**: Creatina, Passos (meta 8.000) e Horário de dormir.

### Changed
- O teste de exclusão definitiva de perfil passa a cobrir os hábitos.

## [0.4.0-alpha.1] - 2026-10-26

### Added
- **Cardio** no menu (V0.4): registrar caminhada, bicicleta, corrida,
  elíptico ou outra atividade, com data, início e duração; distância,
  passos da sessão, intensidade, FC média e notas são opcionais.
- Resumo **Esta semana** (sessões, minutos e km, também por atividade) e
  histórico por semana, com editar e excluir.

### Changed
- O teste de exclusão definitiva de perfil passa a cobrir o cardio.

## [0.3.0] - 2026-10-26

Versão estável da V0.3 — Treino: biblioteca de exercícios, planos com
prescrição e planos-modelo, execução do treino com séries e descanso,
histórico por exercício, sugestão de progressão dupla e questionário do
módulo. Detalhes de cada etapa nas pré-versões abaixo.

### Changed
- O teste de exclusão definitiva de perfil passa a cobrir os dados de
  treino (exercícios próprios, planos, sessões, séries e incrementos).

## [0.3.0-alpha.5] - 2026-10-26

### Added
- **Questionário de Treinos**: na primeira abertura, experiência, dias por
  semana, local e equipamentos (tudo opcional). Pode ser pulado e refeito
  em Configurações › Treino.
- **Sugestões de planos-modelo** em Treinos › Planos, com botão Importar;
  nada é importado sem você.

### Changed
- O armazenamento dos questionários de módulo (Dieta e Treino) passou a
  usar um único componente interno.

## [0.3.0-alpha.4] - 2026-10-26

### Added
- **Histórico por exercício** (Treinos › Exercícios › ícone de gráfico):
  última sessão, melhor carga, melhor série, sessões nas últimas 4 semanas,
  gráfico da carga máxima por sessão e a lista das sessões com as séries e
  o volume.
- **Sugestão de progressão dupla** no treino: quando a última sessão teve
  todas as séries no topo da faixa (e RIR dentro da faixa), o card sugere
  considerar aumentar a carga. É só uma sugestão; nada muda sozinho.
- **Incremento de carga por perfil**, também para os exercícios do Evully.

## [0.3.0-alpha.3] - 2026-10-26

### Added
- **Treinar** (Treinos): iniciar o treino pelo dia do plano (o de hoje vem
  marcado) ou um treino livre; uma sessão aberta por vez, retomada se o
  app fechar.
- Tela de execução: meta e última sessão de cada exercício, séries com
  carga, repetições ou tempo, RIR e ✓ salvas automaticamente; adicionar e
  remover séries; trocar, adicionar ou remover exercícios; cronômetro de
  descanso pela prescrição; finalizar ou descartar o treino.
- A carga de cada série já vem com a da última sessão.

## [0.3.0-alpha.2] - 2026-10-25

### Added
- **Planos de treino** (Treinos › Planos): criar, renomear, arquivar e
  restaurar planos; dias com dia da semana opcional; exercícios da
  biblioteca com prescrição (séries, repetições ou segundos em faixa, por
  lado, RIR, descanso e notas), editável no lugar e reordenável.
- **Importar plano-modelo**: "Cutting 2026" (segunda a sexta) e "Core em
  casa", como cópias editáveis.

## [0.3.0-alpha.1] - 2026-10-25

### Added
- Treino (V0.3): menu **Treinos** com a **Biblioteca de exercícios**.
  Catálogo do Evully com os exercícios do programa inicial (peito, costas,
  pernas, braços, core, lombar e outros), com instruções curtas; busca sem
  acentos e filtro por grupo muscular.
- Exercícios próprios por perfil: criar, editar e desativar, com grupos
  secundários, equipamento, incremento de carga, instruções e notas.

## [0.2.0] - 2026-10-25

Versão estável da V0.2 — Nutrição: catálogo de alimentos da casa,
refeições do dia com cópia dos nutrientes, atalhos e favoritas, metas
nutricionais, água, painel nutricional e questionário do módulo.
Detalhes de cada etapa nas pré-versões abaixo.

### Changed
- O teste de exclusão definitiva de perfil passa a cobrir os dados de
  nutrição (refeições, favoritas, metas e água).

## [0.2.0-alpha.5] - 2026-10-25

### Added
- **Questionário da Dieta**: na primeira abertura, cada perfil escolhe as
  refeições que costuma fazer, se quer acompanhar a água e pode anotar
  restrições alimentares. Pode ser pulado e refeito em Configurações ›
  Nutrição.
- A aba Dia mostra só as refeições escolhidas (e qualquer refeição que já
  tenha itens no dia); sem água, o card some da Dieta e do Dashboard.

## [0.2.0-alpha.4] - 2026-10-25

### Added
- **Metas nutricionais** em Configurações › Nutrição: calorias, proteína,
  carboidratos, gorduras e água. Valem a partir de hoje; dias passados
  mantêm a meta que tinham. O app não preenche nem calcula metas.
- **Água** em Dieta › Dia: +250 ml, +500 ml ou outra quantidade, com a
  lista do dia para desfazer.
- Total do dia contra a meta, com barras de progresso.
- Card **Hoje** no Dashboard com calorias, proteína e água.

## [0.2.0-alpha.3] - 2026-10-25

### Added
- Atalhos de refeição em Dieta › Dia (menu "…" de cada refeição):
  **Repetir de ontem**, **Copiar para…** (outro dia ou outra refeição),
  **Salvar como favorita** e **Usar favorita…**. O que é copiado entra como
  planejado.
- Aba **Favoritas** em Dieta, com os itens e as calorias de cada favorita.

### Changed
- Alimentos usados em favoritas também não podem ser excluídos do catálogo.

## [0.2.0-alpha.2] - 2026-10-25

### Added
- **Dieta** no menu, com as abas **Dia** e **Alimentos**.
- Refeições do dia: café da manhã, lanche da manhã, almoço, pré-treino,
  jantar, ceia e refeições com nome próprio. Adicionar alimentos do
  catálogo, mudar a quantidade (calorias e macros recalculados na hora),
  remover, marcar um item ou a refeição inteira como consumida.
- Total do dia: consumido e planejado.
- Planejar até 30 dias à frente; marcar como consumido só hoje ou antes.
- Cada registro guarda uma cópia do alimento: editar o alimento depois não
  muda dias passados.

### Security
- zod 4.6.7 e fast-uri 3.1.9, com correções de segurança publicadas pelos
  mantenedores.

### Changed
- Um alimento já usado em refeições não pode mais ser excluído do
  catálogo (pode ser editado).

## [0.2.0-alpha.1] - 2026-10-21

### Added
- Nutrição (V0.2): catálogo de **Alimentos** da casa, compartilhado entre
  os perfis. Cadastro com nutrientes por 100 g, por ml ou por porção,
  copiados do rótulo ou da tabela que você usa; busca sem acentos; editar
  e excluir.

### Changed
- O log não registra mais o fechamento normal da janela como falha.

## [0.1.0] - 2026-10-21

Primeira versão estável da V0.1: perfis, questionário de acompanhamento,
projetos, peso, medidas, painel adaptável, backup manual e automático,
importação CSV e configurações. Detalhes de cada etapa nas pré-versões
abaixo.

### Fixed
- Campos do cadastro de perfil desalinhados quando o rótulo "Data de
  nascimento" quebrava em duas linhas (agora "Nascimento").

### Added
- Tela "Algo deu errado" com botão para recarregar, em vez de janela em
  branco, se uma tela falhar.
- Falhas inesperadas do processo principal e do renderer ficam
  registradas no log.
- Testes de persistência após reiniciar e do tempo de inatividade.

## [0.1.0-alpha.10] - 2026-10-21

### Changed
- Painel: sem projeto ativo, convida a criar um; com o prazo encerrado,
  oferece concluir o projeto.
- Painel: peso e as 3 primeiras medidas do perfil aparecem mesmo sem
  registros, com "Dados insuficientes" em vez de sumir.
- Ao concluir um projeto, o app oferece refazer o questionário.

## [0.1.0-alpha.9] - 2026-10-20

### Added
- Configurações — Perfil: arquivar o perfil atual, restaurar perfis
  arquivados e apagá-los definitivamente digitando o nome. Antes de apagar,
  o Evully faz um backup; se ele falhar, nada é apagado.
- Configurações — Geral: tema (igual ao Windows, claro ou escuro) e tempo
  para voltar à seleção de perfil (nunca, 5, 15 ou 30 minutos).
- Configurações — Sobre: versão, aviso de saúde, passo a passo para
  restaurar um backup, licença e avisos de terceiros.
- `THIRD_PARTY_NOTICES` gerado por `npm run notices` e verificado no CI.

### Changed
- Uma configuração do app corrompida volta ao padrão sem afetar as outras.

## [0.1.0-alpha.8] - 2026-10-20

### Added
- Configurações em abas: Acompanhamento, Projeto e Geral e backup.
- Acompanhamento: escolher como o peso aparece no painel, ligar/desligar e
  reordenar as medidas acompanhadas (o histórico das desligadas é mantido),
  renomear, remover e criar etiquetas, e refazer o questionário (mantém o
  projeto ativo).
- Projeto: editar nome, objetivo e datas do projeto ativo, concluí-lo, criar
  um novo quando não houver ativo e ver os projetos anteriores.

## [0.1.0-alpha.7] - 2026-10-16

### Added
- Importação CSV de pesos e medidas para o perfil atual, com
  pré-visualização obrigatória: linhas prontas, duplicadas (ignoradas) e com
  erro (número da linha e motivo). A gravação é tudo ou nada.
- Aceita o formato do Excel em português (`;` e vírgula decimal) e o
  internacional (`,` e ponto); datas DD/MM/AAAA ou AAAA-MM-DD.
- Modelos de CSV para baixar; colunas de medidas que o perfil não acompanha
  passam a ser acompanhadas, com aviso na pré-visualização.

## [0.1.0-alpha.6] - 2026-10-16

### Added
- Backup manual ("Fazer backup agora"), salvo onde você escolher.
- Backup automático ao fechar o app, uma vez por dia, com cópia opcional em
  uma pasta adicional (ex.: OneDrive) e retenção das últimas 10 cópias
  automáticas; backups manuais nunca são apagados.
- Backup automático antes de atualizar o banco (migrations).
- Aviso no topo do app quando o último backup automático falha.
- Tela de Configurações com a seção de backup e instruções de restauração
  manual até a V0.7.

## [0.1.0-alpha.5] - 2026-10-14

### Added
- Medidas: sessão de medidas com as medidas do perfil, na ordem do
  questionário e com a dica de como medir; edição; exclusão com confirmação
  (soft delete); histórico em tabela.
- Gráfico por medida com valor atual, inicial e variação colorida pela
  direção do objetivo.
- Tela inicial com até 3 medidas, ao lado do peso.
- Migration `0005_body_measurements`.

## [0.1.0-alpha.4] - 2026-10-14

### Added
- Peso: registro com data, hora, etiquetas e observação; edição; exclusão
  com confirmação (soft delete); histórico.
- Regras de peso no domínio: peso do dia (última pesagem do dia), tendência
  (média de 7 dias com ao menos 3 dias), peso inicial do projeto e diferenças.
- Gráfico com peso do dia, tendência e marcação dos dias com etiqueta, com
  período do projeto, 30 dias ou tudo.
- Tela inicial mostra o peso conforme a escolha do questionário (tendência,
  peso do dia ou oculto), com a cor da variação pela direção do objetivo.
- Criação de etiquetas pelo formulário de pesagem (nomes únicos por perfil,
  sem diferenciar maiúsculas).
- Migration `0004_body_weights`.

### Changed
- A tela de peso é carregada sob demanda para manter a abertura do app leve.

## [0.1.0-alpha.3] - 2026-10-08

### Added
- Questionário de acompanhamento (passos 2 a 7 e resumo): objetivo, projeto
  com prazo, áreas do corpo, forma de ver o peso, recursos em breve e
  sugestão livre. Regras `tracking-rules@1` transformam as respostas em uma
  proposta que só vale depois de aceita; pular aplica os padrões.
- Projeto ativo com "Dia X de Y" e medidas acompanhadas na tela inicial.
- Catálogo de 13 medidas com instruções de como medir, medidas por perfil,
  etiquetas padrão e histórico de configurações (migration `0003_tracking`).
- Regras de direção dos indicadores por objetivo (README §7.6), prontas para
  o painel.

## [0.1.0-alpha.2] - 2026-10-07

### Added
- Perfis: tela "Quem está usando?" (só nomes e avatares), cadastro e edição
  de perfil (passo 1 do questionário) com validação de nome, nascimento e
  altura, troca de perfil pelo menu "Perfil atual" e retorno à seleção após
  15 minutos sem uso.
- Aviso de saúde exibido uma vez na primeira abertura.
- Tabelas `profiles` e `settings` (migration `0002_profiles_settings`).

### Changed
- Código da interface agora sai minificado (556 kB → 177 kB comprimido).

## [0.1.0-alpha.1] - 2026-10-07

Primeira pré-versão: estrutura da V0.1, sem funcionalidades de uso.

### Added
- Estrutura do monorepo TypeScript (npm workspaces): `apps/desktop`,
  `packages/domain`, `contracts`, `tokens`, `ui`, `app-core`, `app-web`.
- Desktop Electron seguro (contextIsolation, sandbox, CSP, fuses), IPC
  tipado e validado com zod, banco SQLite com migrations (Kysely) e pasta
  de dados separada em desenvolvimento (`Evully-dev`).
- Regra de domínio `projectTimeline` ("Dia X de Y") com testes.
- Design tokens gerados de `tokens.json` e base do shadcn/ui (`Button`).
- Regras de fronteira da arquitetura no ESLint, CI no GitHub Actions e
  instalador Windows (`Evully-Setup-<versão>.exe`).
- Verificação de licenças copyleft (`npm run licenses:check`).

[Unreleased]: https://github.com/lbcamargo94/EvullyApp/compare/v0.4.0-alpha.2...HEAD
[0.4.0-alpha.2]: https://github.com/lbcamargo94/EvullyApp/compare/v0.4.0-alpha.1...v0.4.0-alpha.2
[0.4.0-alpha.1]: https://github.com/lbcamargo94/EvullyApp/compare/v0.3.0...v0.4.0-alpha.1
[0.3.0]: https://github.com/lbcamargo94/EvullyApp/compare/v0.3.0-alpha.5...v0.3.0
[0.3.0-alpha.5]: https://github.com/lbcamargo94/EvullyApp/compare/v0.3.0-alpha.4...v0.3.0-alpha.5
[0.3.0-alpha.4]: https://github.com/lbcamargo94/EvullyApp/compare/v0.3.0-alpha.3...v0.3.0-alpha.4
[0.3.0-alpha.3]: https://github.com/lbcamargo94/EvullyApp/compare/v0.3.0-alpha.2...v0.3.0-alpha.3
[0.3.0-alpha.2]: https://github.com/lbcamargo94/EvullyApp/compare/v0.3.0-alpha.1...v0.3.0-alpha.2
[0.3.0-alpha.1]: https://github.com/lbcamargo94/EvullyApp/compare/v0.2.0...v0.3.0-alpha.1
[0.2.0]: https://github.com/lbcamargo94/EvullyApp/compare/v0.2.0-alpha.5...v0.2.0
[0.2.0-alpha.5]: https://github.com/lbcamargo94/EvullyApp/compare/v0.2.0-alpha.4...v0.2.0-alpha.5
[0.2.0-alpha.4]: https://github.com/lbcamargo94/EvullyApp/compare/v0.2.0-alpha.3...v0.2.0-alpha.4
[0.2.0-alpha.3]: https://github.com/lbcamargo94/EvullyApp/compare/v0.2.0-alpha.2...v0.2.0-alpha.3
[0.2.0-alpha.2]: https://github.com/lbcamargo94/EvullyApp/compare/v0.2.0-alpha.1...v0.2.0-alpha.2
[0.2.0-alpha.1]: https://github.com/lbcamargo94/EvullyApp/compare/v0.1.0...v0.2.0-alpha.1
[0.1.0]: https://github.com/lbcamargo94/EvullyApp/compare/v0.1.0-alpha.10...v0.1.0
[0.1.0-alpha.10]: https://github.com/lbcamargo94/EvullyApp/compare/v0.1.0-alpha.9...v0.1.0-alpha.10
[0.1.0-alpha.9]: https://github.com/lbcamargo94/EvullyApp/compare/v0.1.0-alpha.8...v0.1.0-alpha.9
[0.1.0-alpha.8]: https://github.com/lbcamargo94/EvullyApp/compare/v0.1.0-alpha.7...v0.1.0-alpha.8
[0.1.0-alpha.7]: https://github.com/lbcamargo94/EvullyApp/compare/v0.1.0-alpha.6...v0.1.0-alpha.7
[0.1.0-alpha.6]: https://github.com/lbcamargo94/EvullyApp/compare/v0.1.0-alpha.5...v0.1.0-alpha.6
[0.1.0-alpha.5]: https://github.com/lbcamargo94/EvullyApp/compare/v0.1.0-alpha.4...v0.1.0-alpha.5
[0.1.0-alpha.4]: https://github.com/lbcamargo94/EvullyApp/compare/v0.1.0-alpha.3...v0.1.0-alpha.4
[0.1.0-alpha.3]: https://github.com/lbcamargo94/EvullyApp/compare/v0.1.0-alpha.2...v0.1.0-alpha.3
[0.1.0-alpha.2]: https://github.com/lbcamargo94/EvullyApp/compare/v0.1.0-alpha.1...v0.1.0-alpha.2
[0.1.0-alpha.1]: https://github.com/lbcamargo94/EvullyApp/releases/tag/v0.1.0-alpha.1
