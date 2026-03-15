import type { PullRequest } from "./types"
import { detectStacks } from "./stack"

export type GroupMode = "none" | "repo" | "stack" | "repo-stack"

export interface RepoGroup {
  type: "repo"
  repo: string
  prs: PullRequest[]
}

export interface StackGroup {
  type: "stack"
  repo: string
  prs: PullRequest[]
}

export interface StandaloneGroup {
  type: "standalone"
  prs: PullRequest[]
}

export interface HierarchicalRepoGroup {
  type: "hierarchical"
  repo: string
  stacks: PullRequest[][]
  standalone: PullRequest[]
}

export type GroupedData = RepoGroup | StackGroup | StandaloneGroup | HierarchicalRepoGroup

export function groupByRepo(prs: PullRequest[]): RepoGroup[] {
  const byRepo = new Map<string, PullRequest[]>()
  for (const pr of prs) {
    const existing = byRepo.get(pr.repo) ?? []
    existing.push(pr)
    byRepo.set(pr.repo, existing)
  }
  return Array.from(byRepo.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([repo, prs]) => ({ type: "repo", repo, prs }))
}

export function groupByStack(prs: PullRequest[]): GroupedData[] {
  const byRepo = new Map<string, PullRequest[]>()
  for (const pr of prs) {
    const existing = byRepo.get(pr.repo) ?? []
    existing.push(pr)
    byRepo.set(pr.repo, existing)
  }

  const groups: GroupedData[] = []
  const allStandalone: PullRequest[] = []

  for (const [repo, repoPRs] of byRepo.entries()) {
    const stacks = detectStacks(repoPRs)

    // Find PRs in stacks
    const stackedURLs = new Set(stacks.flatMap(s => s.prs.map(pr => pr.url)))

    // Add stack groups
    for (const stack of stacks) {
      groups.push({ type: "stack", repo, prs: stack.prs })
    }

    // Collect standalone PRs
    for (const pr of repoPRs) {
      if (!stackedURLs.has(pr.url)) {
        allStandalone.push(pr)
      }
    }
  }

  if (allStandalone.length > 0) {
    groups.push({ type: "standalone", prs: allStandalone })
  }

  return groups
}

export function groupByRepoAndStack(prs: PullRequest[]): HierarchicalRepoGroup[] {
  const byRepo = new Map<string, PullRequest[]>()
  for (const pr of prs) {
    const existing = byRepo.get(pr.repo) ?? []
    existing.push(pr)
    byRepo.set(pr.repo, existing)
  }

  return Array.from(byRepo.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([repo, repoPRs]) => {
      const stacks = detectStacks(repoPRs)
      const stackedURLs = new Set(stacks.flatMap(s => s.prs.map(pr => pr.url)))

      const standalone = repoPRs.filter(pr => !stackedURLs.has(pr.url))

      return {
        type: "hierarchical",
        repo,
        stacks: stacks.map(s => s.prs),
        standalone
      }
    })
}
