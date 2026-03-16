---
# raft-076z
title: Unresolved review threads tracking and resolution
status: todo
type: feature
created_at: 2026-03-16T15:53:01Z
updated_at: 2026-03-16T15:53:01Z
parent: raft-65vd
---

When someone leaves review comments, I need to know: which threads are unresolved, what do they want me to fix, and have I addressed them all?

Requirements:
- Fetch review threads with resolution status (GitHub GraphQL: pullRequest.reviewThreads)
- Show unresolved thread count prominently in PR list and panel header
- In Code tab, visually distinguish resolved vs unresolved comments (strikethrough or dimmed for resolved)
- Add keybind to mark a thread as resolved from the TUI (GitHub API: resolveReviewThread mutation)
- Add keybind to jump to next unresolved thread (like 'n' for next)
- Show 'All threads resolved' confirmation when the last one is resolved
- Consider grouping unresolved threads by file for easy navigation

This directly addresses 'I don't know if I need to fix stuff because people left reviews' - the answer should be visible in 2 seconds.
