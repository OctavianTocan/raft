import { useState, useEffect } from "react"
import { useKeyboard, useRenderer } from "@opentui/react"
import { fetchRepoPRs, fetchOpenPRs, getCurrentRepo, updatePRTitle, upsertStackComment } from "../lib/github"
import { detectStacks, buildStackComment, formatStackedTitle } from "../lib/stack"
import { Spinner } from "../components/spinner"
import type { Stack } from "../lib/types"

interface StackCommandProps {
  repo?: string
  sync: boolean
}

function StackView({ stack, syncing }: { stack: Stack; syncing: boolean }) {
  return (
    <box flexDirection="column" paddingBottom={1}>
      <box paddingX={1} paddingBottom={1}>
        <text>
          <span fg="#7aa2f7">
            <strong>Stack in {stack.repo}</strong>
          </span>
          <span fg="#9aa5ce"> ({stack.prs.length} PRs)</span>
        </text>
      </box>
      {stack.prs.map((pr) => (
        <box key={pr.number} flexDirection="row" paddingX={2}>
          <box width={8}>
            <text fg="#bb9af7">[{pr.position}/{pr.stackSize}]</text>
          </box>
          <box width={8}>
            <text>
              <span fg="#7aa2f7">#{pr.number}</span>
            </text>
          </box>
          <box flexGrow={1}>
            <text fg="#c0caf5">{pr.originalTitle}</text>
          </box>
          <box width={8}>
            <text fg={pr.isDraft ? "#6b7089" : "#9ece6a"}>
              {pr.isDraft ? "DRAFT" : "OPEN"}
            </text>
          </box>
        </box>
      ))}
      {syncing && (
        <box paddingX={1} paddingTop={1}>
          <Spinner text="Syncing stack metadata..." color="#e0af68" />
        </box>
      )}
    </box>
  )
}

export function StackCommand({ repo, sync }: StackCommandProps) {
  const renderer = useRenderer()
  const [stacks, setStacks] = useState<Stack[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncDone, setSyncDone] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState("Detecting stacks across your repos...")

  useKeyboard((key) => {
    if (key.name === "q" || key.name === "escape") {
      renderer.destroy()
    }
  })

  useEffect(() => {
    async function load() {
      try {
        let allStacks: Stack[] = []

        if (repo) {
          setLoadingStatus(`Scanning ${repo}...`)
          const prs = await fetchRepoPRs(repo)
          allStacks = detectStacks(prs)
        } else {
          const currentRepo = await getCurrentRepo()
          if (currentRepo) {
            setLoadingStatus(`Scanning ${currentRepo}...`)
            const prs = await fetchRepoPRs(currentRepo)
            allStacks = detectStacks(prs)
          } else {
            setLoadingStatus("Fetching your PRs across all accounts...")
            const allPRs = await fetchOpenPRs()
            const byRepo = new Map<string, typeof allPRs>()
            for (const pr of allPRs) {
              const existing = byRepo.get(pr.repo) ?? []
              existing.push(pr)
              byRepo.set(pr.repo, existing)
            }
            const multiPRRepos = [...byRepo.entries()].filter(([, prs]) => prs.length >= 2)
            for (let i = 0; i < multiPRRepos.length; i++) {
              const [repoName] = multiPRRepos[i]
              setLoadingStatus(`Checking ${repoName} (${i + 1}/${multiPRRepos.length})...`)
              try {
                const repoPRs = await fetchRepoPRs(repoName)
                const repoStacks = detectStacks(repoPRs)
                allStacks.push(...repoStacks)
              } catch { /* skip */ }
            }
          }
        }

        setStacks(allStacks)

        if (sync && allStacks.length > 0) {
          setSyncing(true)
          for (const stack of allStacks) {
            for (const pr of stack.prs) {
              const newTitle = formatStackedTitle(pr.position, pr.stackSize, pr.originalTitle)
              await updatePRTitle(stack.repo, pr.number, newTitle)
              const comment = buildStackComment(stack.prs, pr.number)
              await upsertStackComment(stack.repo, pr.number, comment)
            }
          }
          setSyncing(false)
          setSyncDone(true)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to detect stacks")
      }
    }
    load()
  }, [repo, sync])

  if (error) {
    return (
      <box padding={1}>
        <text fg="#f7768e">Error: {error}</text>
      </box>
    )
  }

  if (stacks === null) {
    return (
      <box padding={1}>
        <Spinner text={loadingStatus} />
      </box>
    )
  }

  if (stacks.length === 0) {
    return (
      <box padding={1}>
        <text fg="#9aa5ce">No stacks detected. PRs must target each other's branches to form a stack.</text>
      </box>
    )
  }

  return (
    <box flexDirection="column" width="100%" height="100%">
      {stacks.map((stack, i) => (
        <StackView key={i} stack={stack} syncing={syncing} />
      ))}
      {syncDone && (
        <box paddingX={1}>
          <text fg="#9ece6a">Stack synced! Titles and comments updated.</text>
        </box>
      )}
      <box paddingX={1} paddingTop={1}>
        <text fg="#6b7089">Press q to exit</text>
      </box>
    </box>
  )
}
