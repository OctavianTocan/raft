---
# raft-if9u
title: Add semantic diffing capabilities
status: completed
type: feature
priority: normal
created_at: 2026-03-16T12:27:20Z
updated_at: 2026-03-16T15:32:43Z
parent: raft-kwlp
---

Make diffs semantic rather than purely line-based. Show what entities (functions, classes, types) changed rather than just line numbers.

## Requirements
- Investigate Tree-sitter integration for structural understanding
- Consider using 'sem' tool (Ataraxy-Labs/sem) for entity-level diffs
- Word-level diff emphasis with similarity threshold (Lumen uses 20% - skip word highlighting on heavily rewritten lines)
- File type detection for syntax-aware diffing
- Entity-level summaries in AI explanations

## Research References  
- sem (Ataraxy-Labs/sem): entity-level diffs showing function/class changes, 16 languages
- Difftastic: Tree-sitter AST diff, falls back to line diff on parse errors
- SemanticDiff: hides style-only changes, detects moved code
