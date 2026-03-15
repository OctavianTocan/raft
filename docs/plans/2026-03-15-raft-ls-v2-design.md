# raft ls v2 Design

Interactive PR list with filtering, navigation, and actions.

## Layout

Header bar -> Tab filters -> Scrollable PR list -> Detail panel + keybinds

## Row format

One line per PR: cursor indicator, status dot, PR#, short repo name, title, relative age.

## Interactions

- j/Down, k/Up: navigate
- Enter: open PR in browser
- c: copy URL to clipboard
- /: toggle search (filters by title, repo, PR#)
- Escape: clear search
- Tab: cycle status tabs (All / Open / Draft)
- q: quit

## Detail panel

4-line fixed panel at bottom showing full repo, title, URL, and keybind hints.

## Colors (Tokyo Night)

- bg: #1a1b26, selected: #292e42
- open dot: #9ece6a, draft dot: #565f89
- PR#: #7aa2f7, repo: #bb9af7, title: #c0caf5, age: #565f89
- tab active: #7aa2f7, tab inactive: #565f89
