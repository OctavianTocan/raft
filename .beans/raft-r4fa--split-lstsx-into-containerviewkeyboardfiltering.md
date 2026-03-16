---
# raft-r4fa
title: Split ls.tsx into Container/View/keyboard/filtering
status: todo
type: task
created_at: 2026-03-16T15:41:39Z
updated_at: 2026-03-16T15:41:39Z
parent: raft-tlm1
blocking:
    - raft-muvz
---

ls.tsx is 697 lines with 23 useState calls in one component. Split into:
- LsCommand (container): state declarations, effects, callbacks (~180 lines)
- ls-keyboard.ts: keyboard handler logic extracted from the 250-line handler (~120 lines)  
- ls-filtering.ts: filter/sort/group computation logic (~80 lines)
- LsView (view): pure rendering, receives all data via props (~150 lines)

Depends on: shared panel hook from raft-muvz
