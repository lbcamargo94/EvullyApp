# Changelog

Todas as mudanças relevantes do Evully. Formato baseado em
[Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/); versões seguem
[SemVer](https://semver.org/lang/pt-BR/) alinhado ao roadmap (`0.1.0` = V0.1).

## [Unreleased]

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

[Unreleased]: https://github.com/lbcamargo94/EvullyApp/compare/v0.1.0-alpha.1...HEAD
[0.1.0-alpha.1]: https://github.com/lbcamargo94/EvullyApp/releases/tag/v0.1.0-alpha.1
