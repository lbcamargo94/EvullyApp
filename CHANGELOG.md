# Changelog

Todas as mudanças relevantes do Evully. Formato baseado em
[Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/); versões seguem
[SemVer](https://semver.org/lang/pt-BR/) alinhado ao roadmap (`0.1.0` = V0.1).

## [Unreleased]

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

[Unreleased]: https://github.com/lbcamargo94/EvullyApp/compare/v0.3.0-alpha.4...HEAD
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
