# Raft PRD

## One-Sentence Vision

**Raft is a queryable PR inbox that watches your pull requests and surfaces what matters next.**

## Product Summary

Raft is a lightweight PR state and event system for GitHub pull requests.

Its job is to:

- keep a continuously updated view of your PR world
- record meaningful PR changes over time
- make that data easy to query for agents and automation
- surface it to humans in a fast, at-a-glance interface

Raft is **not** a full PR workflow suite, code review IDE, or autonomous fixer. It is the **attention layer** for pull requests.

## Problem Statement

People with many PRs across repos/accounts lose track of:

- what PRs they have open
- what changed recently
- what needs attention now
- what became blocked, unblocked, approved, or stale

GitHub’s native UI is good for opening individual PRs, but weak as a persistent, cross-repo, cross-account **PR inbox**.

Current tooling tends to fail in one of two ways:

- too passive: just raw lists
- too ambitious: tries to manage, fix, merge, or automate everything

Raft should solve the right problem:

> **constant, low-friction awareness of PR state and PR change**

## Target Users

### Primary user

A developer managing PRs across multiple repos/accounts who wants:

- a single source of truth for PR attention
- rapid awareness of PR changes
- less polling and context switching

### Secondary user

An AI agent or automation system that wants:

- structured PR state
- event history
- a reliable query surface
- a way to detect what changed and what needs action

## Core Product Principles

### Legible before clever

Raft must be easy to understand before it tries to be smart.

### Watch, don’t meddle

Raft should observe and report PR changes, not autonomously modify PRs.

### Query-first

The canonical interface is structured, scriptable, and machine-friendly.

### Human glanceability matters

Humans should be able to understand their PR world in seconds.

### GitHub-native, not GitHub-replacement

Raft points you to PR work; it does not try to replace the actual PR page.

## Goals

### Primary goals

- Provide a unified PR inbox across GitHub repos/accounts
- Continuously track PR state
- Detect and record meaningful changes as events
- Surface what needs attention next
- Offer a clean CLI/JSON interface for agents/automation
- Support a fast human-facing at-a-glance surface

### Secondary goals

- Support lightweight notifications
- Support historical PR event inspection
- Enable OpenClaw/heartbeat or other consumers to react to PR changes

## Non-Goals

Raft should **not** initially be responsible for:

- auto-fixing review comments
- pushing AI-generated patches
- posting comments
- resolving review threads
- merging PRs autonomously
- being a full code review UI
- being deeply coupled to Telegram or any messaging channel
- being primarily a terminal UI toy

These may exist elsewhere in the ecosystem later, but are not Raft’s core purpose.

## Key Use Cases

### Human use cases

- “Show me all my open PRs across work + personal accounts.”
- “What changed since this morning?”
- “Which PRs need attention first?”
- “Did someone request changes?”
- “Which PR just became mergeable?”
- “Which PR got closed or merged?”
- “What happened while I was away?”

### Agent use cases

- “Give me all PRs that need attention.”
- “Give me events from the last 2 hours.”
- “Tell me which PRs changed state since the last poll.”
- “Fetch PRs with unresolved review activity.”
- “Fetch PRs with failing CI.”
- “Fetch timeline events for PR #123.”

## Product Surfaces

### CLI / JSON interface

This is the primary interface.

Used by:

- agents
- scripts
- automation
- Linux environments
- power users

Requirements:

- structured JSON output
- stable schemas
- simple commands
- fast local querying

### Background daemon

A local service that:

- polls GitHub
- compares current state to previous state
- records events
- updates the local state store

Requirements:

- reliable
- low-noise
- incremental
- safe by default

### Human UI surface

Primary intended human surface:

- **macOS menu bar app**

Purpose:

- at-a-glance PR inbox
- recent changes
- attention indicators
- click through to GitHub

Optional/minimal:

- lightweight CLI summaries
- TUI may exist later, but is not the product center

## Functional Requirements

### PR state tracking

Raft must track at minimum:

- repo
- PR number
- title
- URL
- author
- base branch
- head branch
- draft/open/closed/merged state
- mergeability
- review decision/state
- CI/check summary
- updated timestamp
- created timestamp

### Event detection

Raft must detect and persist meaningful events including:

- PR opened
- PR closed
- PR merged
- draft → ready
- ready → draft
- review requested
- approved
- changes requested
- new review thread / new review comment
- unresolved review count changed
- CI failed
- CI recovered
- mergeability changed
- stale threshold crossed

### Attention scoring

Raft should compute a lightweight attention model to surface:

- new review feedback
- changes requested
- CI failures
- merge conflicts
- newly unblocked PRs
- stale but active PRs

### Querying

Raft must support:

- listing current PRs
- filtering PRs
- sorting PRs
- querying events by time range
- querying events by repo/PR/state
- returning JSON for all major commands

### Multi-account support

Raft should aggregate PRs from multiple authenticated GitHub accounts via `gh` and/or direct API auth.

### Notifications/events for consumers

Raft should expose change information in a way that external systems can consume, such as:

- `raft events --json`
- `raft watch`
- local event store / sqlite
- optional hooks later

## UX Requirements

### Human UX

Humans should be able to answer within seconds:

- what PRs do I have?
- what changed recently?
- what matters most?

Design characteristics:

- compact
- glanceable
- low cognitive load
- minimal chrome
- click-through to GitHub for deeper work

### Agent UX

Agents should never need to drive a terminal UI.

They should be able to:

- query state directly
- filter by machine-readable fields
- inspect events incrementally
- build workflows on top of stable output

## Notification Strategy

### What Raft does

Raft:

- emits or stores events
- exposes them through CLI/query surfaces
- optionally supports local OS-level notification integrations later

### What Raft does not do

Raft does not directly own:

- Telegram messaging
- OpenClaw messaging
- Slack/email delivery logic

Those should be handled by consumer systems.

### Likely notification paths

- macOS menu bar notifications
- OpenClaw heartbeat summaries
- local consumer reading `raft events --json`
- future webhook/output adapters if justified

## Technical Approach

### Baseline sync model

Use **poll + diff**.

Reason:

- works even without repo-level webhook access
- works across many repos
- works with normal GitHub authentication
- simplest robust baseline

### Data storage

Use a local persistent store, likely SQLite, containing:

- current PR snapshot table
- PR event table
- sync metadata/checkpoint table
- account/repo mapping metadata

### GitHub source

Primary likely options:

- `gh` as auth/account discovery bootstrap
- direct API calls for performance/reliability
- avoid UI scraping
- repo webhooks optional later, not required

## MVP Scope

### Include

- PR snapshot syncing
- multi-account support
- local state store
- event detection + persistence
- JSON CLI queries
- attention sorting
- recent-changes querying
- basic human summary surface
- daemon/watch mode

### Exclude

- AI fixing
- PR mutations
- merge automation
- deep review panels
- sidepanel viewer
- full TUI-centric product design
- direct messaging integrations in Raft core

## Success Metrics

### Core product metrics

- user can answer “what changed?” in under 10 seconds
- user can answer “what needs attention?” in under 10 seconds
- agent can query changed PRs in one command
- event detection accuracy is high for core PR transitions
- notification noise stays low

### Qualitative success

- user checks GitHub less reactively
- Raft becomes first stop for PR awareness
- agents use Raft as PR state source before raw repo spelunking

## Risks

### Scope creep

Biggest risk. Raft tries to become:

- review tool
- fix tool
- merge tool
- AI assistant platform

Mitigation:

- hard enforce “PR inbox + watcher” scope

### Notification spam

Too many low-value events will make the system ignored.

Mitigation:

- notify on transitions, not persistent state
- let consumers filter importance

### GitHub API weirdness

Some fields may be slow, inconsistent, or expensive to fetch.

Mitigation:

- incremental syncing
- normalized local state
- careful API selection/caching

### UI confusion

Trying to serve TUI, menu bar, agent CLI, and daemon all at once may blur the product.

Mitigation:

- define CLI/state engine as canonical
- treat menu bar as a consumer of that state

## Future Ideas, Explicitly Deferred

- AI review assistance
- AI fix drafting
- PR comment reply helpers
- merge queue helpers
- stack-aware enhancements beyond visibility
- richer local desktop UI
- webhook optimizations for owned repos
- team/shared PR inbox modes

## Product Thesis

Raft wins if it becomes the place where PR state becomes visible.

It should not try to do the work of PRs.
It should tell humans and agents:

- what exists
- what changed
- what matters
- what deserves attention next
