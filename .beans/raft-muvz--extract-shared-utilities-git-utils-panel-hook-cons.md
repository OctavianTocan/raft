---
# raft-muvz
title: Extract shared utilities (git-utils, panel hook, constants)
status: todo
type: task
created_at: 2026-03-16T15:41:17Z
updated_at: 2026-03-16T15:41:17Z
parent: raft-tlm1
---

Extract utilities duplicated across commands:
- git-utils.ts: runGit (from nav.tsx), runGhMerge (from merge.tsx)
- usePanel hook: panel state management duplicated in ls.tsx and stack.tsx (panelOpen, panelTab, panelData, panelLoading, splitRatio, panelFullscreen, fetch logic, keyboard handling)
- constants.ts: shared color codes (#7aa2f7, #9ece6a, etc.), magic numbers (header height 9, list offset 7)

This must be done FIRST since other refactors depend on these shared pieces.
