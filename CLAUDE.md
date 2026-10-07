# Evully — agent guide

Local-first fitness app (Electron + React + TS + SQLite), multi-profile,
growing to web (NestJS API + React SPA/PWA + Next.js site) and native
mobile (Expo). **Current phase: V0.1 — scaffold done; features next.**

## Language
- Talk to the user in **Portuguese (pt-BR)**. UI text in pt-BR.
- Code, identifiers, DB, commits, and these agent files in **English**.

## Source of truth (read only what the task needs)
| Doc | Covers |
|---|---|
| README.md | Product spec, roadmap (§4), data rules (§6–§7), V0.1 (§8), later versions (§9–§15), open questions (§33) |
| ARCHITECTURE.md | Layers, dependency rule, module layout, Clean Code rules, decision log (§9) |
| FRONTEND.md | app-core / app-web / ui-native, site, PWA, Expo |
| BACKEND.md | NestJS modules, auth, API conventions, sync protocol |
| DESIGN.md | Tokens, components, layout, accessibility |
| SECURITY.md | Threat model, Electron/IPC/data rules, per-version checklist |

**README.md has ~2,300 lines. Never read it whole.** Find the section
with `Grep` on `^#{2,4} <n>\.` and read only that range (`offset`/`limit`).
Same for any doc over ~300 lines.

## Workflow
- Every implementation task: run the `/evully-task` skill.
- Any decision or doc change: run the `/evully-docs-sync` skill.
- Only the current version (README §4). Never start a later version or
  phase unasked. Propose files before implementing (README §32.2).

## Non-negotiables (details in ARCHITECTURE.md)
- Business rules only in `packages/domain` (pure TS, no framework, no I/O,
  no `Date.now()`; time comes from the `Clock` port).
- Use cases depend on ports; adapters implement them. No NestJS/Electron/
  React imports in `application/` or `packages/app-core`.
- Every personal-data query filters by `profile_id`; isolation tests required.
- Validation with zod schemas from `packages/contracts`.
- UUID v7 ids; dates `YYYY-MM-DD` local, instants ISO UTC; kg/cm stored.
- Soft delete; never destructive deletes without explicit confirmation.
- No personal or health data in logs. No secrets in the repo.
- Colors only via design tokens; direction colors per README §7.6.
- No medical advice, no AI-computed numbers, no silent changes to user data.

## Conventions
- Conventional Commits; branches `feat/…`, `fix/…`; SemVer `0.1.0` = V0.1.
- Commit/push only when the user asks.
- Record architectural decisions in ARCHITECTURE.md §9 with date and reason.

## Token economy
- Be concise; no recaps of unchanged content; never paste whole files.
- Do not re-read a file you just edited; batch independent tool calls.
- Prefer deterministic scripts over manual checks: `node scripts/check-docs.mjs`.
- Use `Grep`/`Glob` with tight patterns before `Read`; read ranges, not files.
- Do not spawn subagents unless the user asks.
- Keep this file short; detail belongs in the docs above or in skills.

## Commands
| Task | Command |
|---|---|
| Run app (dev, data in `%APPDATA%\Evully-dev`) | `npm run dev` |
| Lint (incl. architecture boundaries) | `npm run lint` |
| Typecheck | `npm run typecheck` |
| Tests (desktop tests run under Electron) | `npm test` |
| Format | `npm run format` / `npm run format:check` |
| Docs references | `npm run docs:check` |
| Build / installer | `npm run build` / `npm run dist` |
| Regenerate tokens.css after editing tokens.json | `npm run build -w @evully/tokens` |

Pin `electron` to an exact version. Keep Vite 7, `@vitejs/plugin-react` 5,
TypeScript 6.0.x until electron-vite / typescript-eslint support newer ones.
