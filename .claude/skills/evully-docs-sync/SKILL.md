---
name: evully-docs-sync
description: Keep Evully documentation consistent after a decision or spec change. Use whenever README, ARCHITECTURE, FRONTEND, BACKEND, DESIGN or SECURITY must change.
---

# Evully documentation sync

1. **Single home per fact.** Put the detail in the one doc that owns it
   (spec → README; layers/decisions → ARCHITECTURE; UI platforms →
   FRONTEND; API/sync → BACKEND; tokens/components → DESIGN; threats and
   controls → SECURITY). Elsewhere, link with `[DOC.md](DOC.md), §n`
   instead of copying text.
2. **Find every mention** of the changed concept with one Grep across
   `*.md` (and `CLAUDE.md`), then edit only those lines. Do not read whole
   documents.
3. **Architectural decision?** Add a row to ARCHITECTURE.md §9 (date,
   decision, reason). Spec decision that closes an open question? Move it
   out of README §33.
4. **Run** `node scripts/check-docs.mjs` and fix anything it reports.
5. **Report** in pt-BR: which files changed and why, in a short list.
   Commit only when the user asks, using `docs:` Conventional Commits.
