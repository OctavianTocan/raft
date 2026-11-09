export type SplitPhase = "analyzing" | "approved" | "branching" | "publishing" | "ready" | "merging" | "done"

export type SplitEntryStatus = "pending" | "created" | "ready" | "reviewing" | "approved" | "merged"

export interface SplitEntry {
  number: number
  name: string
  branch: string
  files: string[]
  lines: number
  dependsOn: number[]
  prNumber: number | null
  prUrl: string | null
  status: SplitEntryStatus
}

export interface SplitState {
  version: number
  originalBranch: string
  targetBranch: string
  strategy: string
  createdAt: string
  status: SplitPhase
  topology: "linear" | "dag"
  splits: SplitEntry[]
}

export async function readSplitState(repoRoot: string): Promise<SplitState | null> {
  const path = `${repoRoot}/.raft-split.json`
  try {
    const file = Bun.file(path)
    const text = await file.text()
    return JSON.parse(text) as SplitState
  } catch {
    return null
  }
}

export function writeSplitState(repoRoot: string, state: SplitState): void {
  const path = `${repoRoot}/.raft-split.json`
  Bun.write(path, JSON.stringify(state, null, 2) + "\n")
}

/** Build a tree-line display of the split topology. */
export function formatSplitTopology(state: SplitState): string[] {
  const lines: string[] = []
  const { splits, targetBranch } = state

  // Build adjacency: parent -> children
  // A split's parent is the split it depends on. Roots depend on nothing (target main).
  const roots: SplitEntry[] = []
  const childrenOf = new Map<number, SplitEntry[]>()

  for (const split of splits) {
    if (split.dependsOn.length === 0) {
      roots.push(split)
    } else {
      for (const dep of split.dependsOn) {
        const existing = childrenOf.get(dep) ?? []
        existing.push(split)
        childrenOf.set(dep, existing)
      }
    }
  }

  lines.push(targetBranch)

  function renderNode(split: SplitEntry, prefix: string, isLast: boolean) {
    const connector = isLast ? "\u2514\u2500\u2500" : "\u251C\u2500\u2500"
    const prTag = split.prNumber ? `#${split.prNumber} ` : ""
    const statusTag = `[${split.status}]`
    lines.push(`${prefix}${connector} ${split.number}. ${prTag}${split.name} ${statusTag} (${split.lines} lines)`)

    const children = childrenOf.get(split.number) ?? []
    const childPrefix = prefix + (isLast ? "    " : "\u2502   ")
    for (let i = 0; i < children.length; i++) {
      renderNode(children[i], childPrefix, i === children.length - 1)
    }
  }

  for (let i = 0; i < roots.length; i++) {
    renderNode(roots[i], "", i === roots.length - 1)
  }

  return lines
}
