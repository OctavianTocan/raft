---
# raft-0qqx
title: Refactor log.tsx and extract tree rendering
status: todo
type: task
created_at: 2026-03-16T15:41:39Z
updated_at: 2026-03-16T15:41:39Z
parent: raft-tlm1
---

log.tsx is 326 lines with tripled load logic. Split into:
- log-container.tsx: state management and fetch (~120 lines)
- log-tree.tsx: tree node building and connector rendering (~80 lines)
- log-loader.ts: deduplicated fetch logic (explicit repo, current repo, all repos) (~70 lines)
