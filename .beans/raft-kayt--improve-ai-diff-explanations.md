---
# raft-kayt
title: Improve AI diff explanations
status: todo
type: feature
created_at: 2026-03-16T12:27:12Z
updated_at: 2026-03-16T12:27:12Z
parent: raft-kwlp
---

Current AI explanations use a basic prompt and generate 1-2 sentence summaries per file. Could be much better based on research into Critique and Lumen approaches.

## Requirements
- Improve prompt structure: shorter, focused (~1800 tokens), with priority weighting
- Preprocess diffs before sending to LLM (filter noise like lockfiles, chunk by semantic boundaries)
- Progressive streaming: show explanations as they generate, not all-at-once
- Consider Critique-style hunk reordering: group related changes, order by code flow
- Consider entity-level summaries: 'function authenticateUser was modified' instead of line numbers
- Variable-width rendering: 80-char prose, full-width code blocks
- Better error handling and retry logic

## Research References
- Critique (remorses/critique): AI reorders/splits/groups hunks by code flow, streams YAML progressively
- Lumen (jnsahaj/lumen): 20% similarity threshold for word-level highlighting
- Research: ~1800 token prompts outperform exhaustive ones, preprocessing diffs is critical
