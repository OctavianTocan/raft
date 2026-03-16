---
# raft-2qxc
title: Replace decorative scrollbar with OpenTUI native <scrollbox>
status: completed
type: feature
priority: normal
created_at: 2026-03-16T12:26:55Z
updated_at: 2026-03-16T15:26:06Z
parent: raft-kwlp
---

Current scrollbar in preview-panel.tsx is purely visual Unicode art (block chars). Not clickable, not draggable, mouse wheel doesn't work. OpenTUI has ScrollBoxRenderable with full mouse support, keyboard handling, macOS-style scroll acceleration, and viewport culling.

## Requirements
- Wrap panel content in <scrollbox> component
- Mouse wheel scrolling works
- Click-to-position on scrollbar track
- Drag scrollbar thumb to scroll
- Keyboard scrolling still works (j/k)
- Optional macOS-style scroll acceleration
- Viewport culling for performance with large diffs
- Apply to all panel tabs (body, comments, code, files)
