---
# raft-sat2
title: Deduplicate nav.tsx and merge.tsx git helpers
status: todo
type: task
created_at: 2026-03-16T15:41:39Z
updated_at: 2026-03-16T15:41:39Z
parent: raft-tlm1
---

nav.tsx (296 lines) has 3 commands that should be separate files. merge.tsx (268 lines) duplicates git helpers.
- Extract runGit to git-utils.ts (shared with nav commands)
- Split nav.tsx into nav-command.tsx, create-command.tsx, restack-command.tsx
- Extract runGhMerge from merge.tsx to github-reviews.ts
- Add TSDoc to all extracted functions
