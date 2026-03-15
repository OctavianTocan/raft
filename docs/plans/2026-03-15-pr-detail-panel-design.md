# PR Detail Panel & Density Toggle Design

**Date:** 2026-03-15
**Status:** Approved
**Scope:** `raft ls` command enhancements

## Summary

Two features for `raft ls`:
1. **Density toggle** - cycle through compact/normal/detailed list views showing progressively more PR metadata
2. **Preview panel** - overlay drawer that slides in from the right showing PR body, review comments, and inline code comments

## Feature 1: Density Toggle

Press `v` to cycle through three density levels.

### Compact (current default)

```
  > . #24   ai-nexus           feat(ui): add AccessRequestBanner...          0d
```

Columns: status dot, PR#, repo, title, age.

### Normal

```
  > . #24   ai-nexus           feat(ui): add AccessRequestBanner...    v2 x1  7  0d
```

Adds: review status (approved/changes requested/pending counts), comment count.

### Detailed (two lines per PR)

```
  > . #24   ai-nexus           feat(ui): add AccessRequestBanner...    v2 x1  7  0d
              feat/access-request-banner                              +142 -38
```

Adds: branch name, lines changed (+/-).

### Review Status Format

- `v` green = approved count
- `x` red = changes requested count
- `o` muted = pending count
- Only non-zero counts shown

### Data Fetching

Compact mode uses existing `gh search prs` data (no extra calls).

Normal and Detailed modes need per-PR API calls:
- `gh api repos/{owner}/{repo}/pulls/{number}` for additions, deletions, comments count
- `gh api repos/{owner}/{repo}/pulls/{number}/reviews` for review states

Fetched lazily when switching to a denser mode. Columns show a loading indicator until data arrives. Results cached in-memory for the session.

## Feature 2: Preview Panel (Overlay Drawer)

### Opening & Closing

- `p` toggles the drawer open/closed
- `Escape` also closes it (when not in search mode)
- Drawer covers ~60% of terminal width from the right
- Left ~40% shows a compressed PR list (dot + PR# + truncated title)

### Layout

```
+- PR List (40%) ------+- Preview (60%) -------------------------------------+
|  > . #24  feat(ui)...|  #24 feat(ui): add AccessRequestBanner             |
|    . #22  fix(auth)...|  ai-nexus  .  feat/access-request-banner           |
|    o #18  refactor... |  ---------------------------------------------------  |
|    . #15  docs: up... |  Body | Comments (7) | Code Comments (3)           |
|    . #12  feat(api)...|  ---------------------------------------------------  |
|                       |                                                     |
|                       |  ## What this PR does                               |
|                       |                                                     |
|                       |  Adds the AccessRequestBanner component             |
|                       |  that shows when a user needs to request            |
|                       |  access to a workspace.                             |
+-----------------------+-----------------------------------------------------+
```

### Panel Header

- Line 1: PR number + full title (bold)
- Line 2: Repo name + branch name (muted)
- Line 3: Divider
- Line 4: Tab bar with counts

### Tabs

Switch with `1`/`2`/`3` or `Tab` to cycle.

**Body** - PR description rendered with basic markdown formatting (bold headers, indented lists, dim code blocks). Not full markdown, just enough to be readable.

**Comments** - Review-level and conversation comments, chronological (newest at bottom).

Each comment shows:
```
  +- @reviewer . 2d ago . approved v
  |  Looks good! Just one nit on the error handling.
  +-
```

- Author colored by review state (green = approved, red = changes requested, muted = comment only)
- Bot comments (Greptile, Vercel, etc.) shown but visually dimmer

**Code Comments** - Inline review comments on specific files/lines:

```
  +- @reviewer . 1d ago
  |  src/components/Banner.tsx:42
  |  > const [loading, setLoading] = useState(false)
  |
  |  Consider using useTransition here instead of manual
  |  loading state.
  +-
```

- File path + line number
- Quoted code snippet (dimmer)
- Comment body

### Navigation (Panel Open)

| Key | Action |
|-----|--------|
| `j`/`k` | Scroll panel content |
| Up/Down arrows | Move PR selection (panel updates to new PR) |
| `1`/`2`/`3` | Switch tab |
| `Tab` | Cycle tabs |
| Mouse scroll | Scroll panel content |
| `+`/`-` | Resize split (10% increments, min 30% list, max 80% panel) |
| `Enter` | Open PR in browser |
| `c` | Copy URL |
| `p`/`Escape` | Close panel |
| `q` | Quit |

Search, filter, sort, and density toggle are disabled while the panel is open.

### Data Fetching

When panel opens for a PR, fetch in parallel:
- `gh api repos/{owner}/{repo}/pulls/{number}` for full body
- `gh api repos/{owner}/{repo}/pulls/{number}/reviews` for review comments
- `gh api repos/{owner}/{repo}/pulls/{number}/comments` for inline code comments
- `gh api repos/{owner}/{repo}/issues/{number}/comments` for conversation comments

Show spinner while loading. Cache per PR URL. Prefetch next/prev PR in list.

## New Keyboard Shortcuts Summary

### Normal Mode (no panel)

All existing keys unchanged, plus:
- `v` - cycle density (compact / normal / detailed)
- `p` - open preview panel

### Panel Open Mode

- `j`/`k` - scroll panel
- Up/Down - move PR selection
- `1`/`2`/`3` - switch tab
- `Tab` - cycle tab
- `+`/`-` - resize split
- `Enter` - open in browser
- `c` - copy URL
- `p`/`Escape` - close panel
- `q` - quit

## New Types

```typescript
interface PRDetails {
  additions: number
  deletions: number
  commentCount: number
  reviews: Review[]
  headRefName: string
}

interface Review {
  user: string
  state: "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED" | "PENDING"
}

interface PRPanelData {
  body: string
  comments: Comment[]
  codeComments: CodeComment[]
}

interface Comment {
  author: string
  body: string
  createdAt: string
  authorAssociation: string
}

interface CodeComment {
  author: string
  body: string
  path: string
  line: number
  diffHunk: string
  createdAt: string
}
```

## New Files

```
src/
  components/
    preview-panel.tsx     # overlay drawer container
    panel-body.tsx        # PR body/description tab
    panel-comments.tsx    # review comments tab
    panel-code.tsx        # inline code comments tab
    markdown.tsx          # basic markdown text renderer
  lib/
    cache.ts              # in-memory PR data cache
```

## Modified Files

```
src/
  commands/ls.tsx         # new state, keyboard handlers, layout logic
  components/pr-table.tsx # density modes + compressed mode
  lib/github.ts           # new fetch functions for details/comments
  lib/types.ts            # new interfaces
```

## Caching Strategy

- **Density data** (PRDetails): fetched in parallel for all visible PRs on mode switch. Cached in Map<url, PRDetails>.
- **Panel data** (PRPanelData): fetched on-demand per PR. Cached in Map<url, PRPanelData>. Prefetch adjacent PRs.
- No disk persistence. Fresh data each `raft ls` session.

## Markdown Renderer

Minimal parser handling:
- `#`/`##`/`###` as bold text
- `- `/`* ` as indented list items
- Inline backtick code as dim/highlighted
- Triple-backtick blocks as indented + dim background
- `**bold**` as strong
- Blank lines as spacing
- Everything else as plain text
