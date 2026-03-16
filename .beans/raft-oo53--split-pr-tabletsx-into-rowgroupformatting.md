---
# raft-oo53
title: Split pr-table.tsx into row/group/formatting
status: todo
type: task
created_at: 2026-03-16T15:41:39Z
updated_at: 2026-03-16T15:41:39Z
parent: raft-tlm1
---

pr-table.tsx is 457 lines with duplicated row layouts across density modes. Split into:
- pr-row.tsx: single PR row component with density prop (~100 lines)
- pr-group-renderer.tsx: grouped rendering (repo, stack, standalone, hierarchical) (~140 lines)
- pr-formatting.ts: formatReviewStatus, color constants, cell helpers (~50 lines)
- pr-table.tsx: thin orchestrator that delegates to row/group components (~80 lines)
