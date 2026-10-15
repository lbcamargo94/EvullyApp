# Changelog

Todas as mudanças relevantes do Evully. Formato baseado em
[Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/); versões seguem
[SemVer](https://semver.org/lang/pt-BR/) alinhado ao roadmap (`0.1.0` = V0.1).

## [Unreleased]

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

[Unreleased]: https://github.com/lbcamargo94/EvullyApp/compare/v0.1.0-alpha.5...HEAD
[0.1.0-alpha.5]: https://github.com/lbcamargo94/EvullyApp/compare/v0.1.0-alpha.4...v0.1.0-alpha.5
[0.1.0-alpha.4]: https://github.com/lbcamargo94/EvullyApp/compare/v0.1.0-alpha.3...v0.1.0-alpha.4
[0.1.0-alpha.3]: https://github.com/lbcamargo94/EvullyApp/compare/v0.1.0-alpha.2...v0.1.0-alpha.3
[0.1.0-alpha.2]: https://github.com/lbcamargo94/EvullyApp/compare/v0.1.0-alpha.1...v0.1.0-alpha.2
[0.1.0-alpha.1]: https://github.com/lbcamargo94/EvullyApp/releases/tag/v0.1.0-alpha.1
