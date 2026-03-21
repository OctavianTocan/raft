# RepoBar Reference for Raft

This note captures what Raft should borrow from [RepoBar](https://github.com/steipete/RepoBar), what it should avoid, and how the two products differ.

## Why RepoBar Matters

RepoBar is a strong reference because it validates three things that matter for Raft:

1. **A menu bar app is a credible primary human surface** for at-a-glance GitHub awareness.
2. **CLI + native UI can share one core data layer** cleanly.
3. **Fast, glanceable awareness beats deep in-app workflows** for this class of tool.

RepoBar proves that a native menu bar app is not just aesthetic decoration — it can be the main human UX.

## RepoBar’s Product Shape

RepoBar is effectively:

- a native macOS menu bar app
- a CLI for scripts and terminal use
- a shared core library
- a GitHub awareness layer for repositories

Its surface area includes:

- CI status
- issues
- pull requests
- releases
- traffic/activity
- local git state
- repo pinning/filtering/sorting
- menu-based drill-downs

This is broader than what Raft should be.

## What Raft Should Borrow

### 1. Architecture split

RepoBar’s structure is a very good model:

- shared core library
- CLI consumer
- native app consumer

Raft should follow the same pattern:

- `RaftCore` — canonical PR state/event engine
- `raft` CLI — queryable interface for humans, scripts, and agents
- future macOS menu bar app — at-a-glance human interface

### 2. Menu bar as the human surface

RepoBar strongly supports the idea that the human-facing Raft UX should be:

- native
- compact
- glanceable
- fast to open and dismiss
- shallow by design

This is a better fit than treating the terminal UI as the primary human product.

### 3. CLI parity with the app

RepoBar’s CLI exists to expose the same data surfaces as the app.

Raft should do the same, but with an even stronger emphasis on agent-friendly output:

- stable commands
- stable JSON schemas
- machine-readable filters
- minimal ceremony

### 4. Refresh and caching mindset

RepoBar already has the right instincts around:

- local caching
- refresh scheduling
- avoiding expensive live rendering on every interaction

Raft should adopt that mindset for:

- PR snapshots
- event timelines
- attention scoring
- notification triggers

### 5. Click-through philosophy

RepoBar does not try to replace GitHub in depth.
It gives you awareness and then lets you open the real thing.

Raft should absolutely keep that principle.

## What Raft Should Not Copy

### 1. Broad repo dashboard scope

RepoBar is a repository dashboard.
Raft should be a **PR inbox**.

That means Raft should not expand into:

- releases
- discussions
- tags
- traffic
- repo-level analytics
- local project management
- broad repo health dashboards

unless they directly help answer PR-attention questions.

### 2. Surface-area sprawl

RepoBar has many submenus, settings, local actions, and secondary workflows.

Raft should resist that expansion. The product is stronger if it remains narrow.

### 3. Deep in-app work

Raft should not become a place where PR work is fully performed.
The browser, `gh`, agents, and external workflows can do that.

Raft should focus on:

- what exists
- what changed
- what matters
- what deserves attention next

### 4. Local repo workflow extras

RepoBar includes local git state and local sync actions. Those are useful for RepoBar’s goals but not necessarily for Raft’s first product shape.

Raft should only adopt local-repo features if they directly support PR awareness.

## Key Difference: RepoBar vs Raft

### RepoBar

**RepoBar is a GitHub repository awareness dashboard.**

It answers questions like:

- what repos are active?
- what is happening in this repo?
- what is the current CI / release / issue / traffic picture?

### Raft

**Raft should be a queryable PR inbox and attention layer.**

It answers questions like:

- what PRs do I have?
- what changed recently?
- which PRs need attention now?
- what events happened while I was away?

RepoBar is repo-centric.
Raft should be PR-centric.

## Product Translation for Raft

The best translation is not:

> “Build a RepoBar clone for PRs.”

It is:

> “Use RepoBar’s app/CLI/core structure and glanceable UX discipline to build a much narrower PR inbox.”

That means:

- **copy the form**
- **not the breadth**

## Recommended Borrow List

If implementing Raft, the most valuable ideas to borrow from RepoBar are:

- shared core + CLI + app architecture
- menu bar app as the primary human surface
- compact, low-friction at-a-glance UX
- caching + scheduled refresh
- click-through to GitHub for deep work
- strong CLI output discipline

## Recommended Cut List for Raft

To keep Raft focused, avoid copying these RepoBar patterns into the first product:

- issues/release/discussion dashboards
- extensive submenu trees
- local project management actions
- repo pinning/hiding complexity beyond what PR attention requires
- sprawling settings surfaces
- trying to make the app a full replacement for GitHub

## Bottom Line

RepoBar is the right **UI and architecture reference** for Raft.

But Raft should be:

- narrower
- more event-driven
- more PR-specific
- more agent-friendly
- multi-account and local-`gh`-first
- less broad than RepoBar

## One-Sentence Guidance

**Borrow RepoBar’s shape, not its scope.**
ent-friendly
- less broad than RepoBar

## One-Sentence Guidance

**Borrow RepoBar’s shape, not its scope.**
acement for GitHub

## Bottom Line

RepoBar is the right **UI and architecture reference** for Raft.

But Raft should be:

- narrower
- more event-driven
- more PR-specific
- more agent-friendly
- less broad than RepoBar

## One-Sentence Guidance

**Borrow RepoBar’s shape, not its scope.**
