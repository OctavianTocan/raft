---
# raft-vuys
title: Add fullscreen mode and panel border improvements
status: completed
type: feature
priority: normal
created_at: 2026-03-16T12:27:01Z
updated_at: 2026-03-16T15:28:01Z
parent: raft-kwlp
---

Panel currently fades into the background oddly. Need a clear visual boundary and a way to go fullscreen for focused reading/review.

## Requirements
- Add visible border on the left side of the panel (where it meets the PR list)
- Clear visual separation so panel doesn't fade into background
- Add fullscreen toggle (e.g. 'f' key) that expands panel to full terminal width
- In fullscreen, hide the PR list entirely
- Navigation still works in fullscreen (up/down to change PR)
- Press 'f' or escape to exit fullscreen back to split view
