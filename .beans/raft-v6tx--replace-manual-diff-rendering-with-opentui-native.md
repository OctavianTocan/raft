---
# raft-v6tx
title: Replace manual diff rendering with OpenTUI native <diff> component
status: completed
type: feature
priority: normal
created_at: 2026-03-16T12:26:48Z
updated_at: 2026-03-16T15:21:07Z
parent: raft-kwlp
---

Currently panel-files.tsx renders diffs manually with renderDiffLine(), which only shows additions properly - deletions look odd. OpenTUI has a built-in <diff> component with split/unified view, word-level diff highlighting, Tree-sitter syntax highlighting, line numbers, and customizable colors. Replace the manual implementation with the native component.

## Requirements
- Use OpenTUI's DiffRenderable via <diff> JSX element
- Support split view (auto-detect based on terminal width, split at 100+ cols)
- Word-level diff highlighting (addedContentBg/removedContentBg)
- Syntax highlighting via Tree-sitter (filetype prop)
- Proper line numbers on both sides
- Tokyo Night color scheme for diff colors
- Show both additions AND deletions properly
