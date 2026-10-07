---
name: evully-task
description: Standard workflow for any Evully implementation task (feature, fix, migration, scaffold). Use before writing code in this repository.
---

# Evully implementation task

Follow these steps in order. Keep messages to the user short and in pt-BR.

1. **Locate the scope.** Identify the version (README §4) and the module.
   Read only the relevant README section(s) via Grep on the heading, plus
   the matching part of ARCHITECTURE.md, FRONTEND.md or BACKEND.md.
   Out of the current version? Stop and ask.
2. **Propose.** List the files to create/change, migrations, tests and
   any open question, in one compact table. Wait for approval unless the
   user already approved this exact plan.
3. **Implement by layer, inside out:** `packages/contracts` (schemas) →
   `packages/domain` (rules + tests first) → `application/` (use case +
   ports) → `adapters/` (Kysely, IPC/HTTP) → `packages/app-core` → UI
   (`packages/app-web`). New table or column → new Kysely migration; never
   edit a published migration.
4. **Check** (when the scaffold exists): `npm run lint`, `npm run typecheck`,
   `npm run test`, `npm run build`. Fix failures before reporting.
   Also verify: `profile_id` isolation test for new queries, no personal
   data in logs, tokens instead of literal colors, SECURITY.md checklist.
5. **Docs.** If behavior, schema or a decision changed, run the
   `/evully-docs-sync` skill. Add a `CHANGELOG.md` entry under Unreleased.
6. **Report** in pt-BR: what was done, checks run with results, what is
   pending. No recap of unchanged content. Do not commit unless asked.
