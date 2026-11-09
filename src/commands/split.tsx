import { useState, useEffect, useCallback } from "react"
import { useKeyboard, useRenderer } from "@opentui/react"
import { Spinner } from "../components/spinner"
import { readSplitState, formatSplitTopology } from "../lib/split-state"
import type { SplitState, SplitEntry } from "../lib/split-state"

interface SplitCommandProps {
  repo?: string
}

async function getRepoRoot(): Promise<string | null> {
  const proc = Bun.spawn(["git", "rev-parse", "--show-toplevel"], {
    stdout: "pipe",
    stderr: "pipe",
  })
  const stdout = await new Response(proc.stdout).text()
  const code = await proc.exited
  return code === 0 ? stdout.trim() : null
}

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    pending: "#6b7089",
    created: "#7aa2f7",
    ready: "#e0af68",
    reviewing: "#bb9af7",
    approved: "#9ece6a",
    merged: "#73daca",
  }
  const color = colorMap[status] ?? "#6b7089"
  return <text fg={color}>[{status}]</text>
}

function SplitRow({ split, isSelected, index, onSelect }: {
  split: SplitEntry
  isSelected: boolean
  index: number
  onSelect?: (i: number) => void
}) {
  const bgColor = isSelected ? "#292e42" : "transparent"
  const cursor = isSelected ? "\u25B8" : " "

  return (
    <box
      flexDirection="row"
      backgroundColor={bgColor}
      paddingX={1}
      height={1}
      onMouseDown={() => onSelect?.(index)}
    >
      <box width={2}>
        <text fg={isSelected ? "#7aa2f7" : "#6b7089"}>{cursor}</text>
      </box>
      <box width={4}>
        <text fg="#bb9af7">{split.number}.</text>
      </box>
      <box width={8}>
        {split.prNumber ? (
          <text fg="#7aa2f7">#{split.prNumber}</text>
        ) : (
          <text fg="#6b7089">--</text>
        )}
      </box>
      <box flexGrow={1}>
        <text fg="#c0caf5">{split.name}</text>
      </box>
      <box width={6}>
        <text fg="#9aa5ce">{split.lines}L</text>
      </box>
      <box width={14}>
        <StatusBadge status={split.status} />
      </box>
    </box>
  )
}

export function SplitCommand({ repo }: SplitCommandProps) {
  const renderer = useRenderer()
  const [state, setState] = useState<SplitState | null | "loading">("loading")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [flash, setFlash] = useState<string | null>(null)

  const splits = state && state !== "loading" ? state.splits : []

  const showFlash = useCallback((msg: string) => {
    setFlash(msg)
    setTimeout(() => setFlash(null), 2000)
  }, [])

  useKeyboard((key) => {
    if (key.name === "q" || key.name === "escape") {
      renderer.destroy()
    } else if (key.name === "j" || key.name === "down") {
      setSelectedIndex((i) => Math.min(splits.length - 1, i + 1))
    } else if (key.name === "k" || key.name === "up") {
      setSelectedIndex((i) => Math.max(0, i - 1))
    } else if ((key.name === "enter" || key.name === "return") && splits[selectedIndex]?.prUrl) {
      Bun.spawn(["open", splits[selectedIndex].prUrl!], { stdout: "ignore", stderr: "ignore" })
      showFlash("Opening PR...")
    } else if (key.name === "c" && splits[selectedIndex]?.prUrl) {
      renderer.copyToClipboardOSC52(splits[selectedIndex].prUrl!)
      showFlash("Copied URL!")
    }
  })

  useEffect(() => {
    async function load() {
      const root = await getRepoRoot()
      if (!root) {
        setState(null)
        return
      }
      const splitState = await readSplitState(root)
      setState(splitState)
    }
    load()
  }, [])

  if (state === "loading") {
    return (
      <box padding={1}>
        <Spinner text="Loading split state..." />
      </box>
    )
  }

  if (state === null) {
    return (
      <box padding={1}>
        <text fg="#9aa5ce">No active split. Use /split-branch to start a split.</text>
      </box>
    )
  }

  const topologyLines = formatSplitTopology(state)
  const approvedCount = state.splits.filter((s) => s.status === "approved" || s.status === "merged").length
  const mergedCount = state.splits.filter((s) => s.status === "merged").length

  return (
    <box flexDirection="column" width="100%" height="100%">
      {/* Header */}
      <box flexDirection="row" paddingX={1} height={1}>
        <box flexGrow={1}>
          <text>
            <span fg="#7aa2f7"><strong>raft split</strong></span>
            <span fg="#9aa5ce"> - {state.originalBranch} {"->"} {state.targetBranch}</span>
          </text>
        </box>
        <box>
          <text fg="#9aa5ce">
            {state.strategy} | {approvedCount}/{state.splits.length} approved | {mergedCount} merged
          </text>
        </box>
      </box>

      {/* Phase */}
      <box paddingX={1} height={1}>
        <text>
          <span fg="#6b7089">Phase: </span>
          <span fg="#e0af68">{state.status}</span>
          <span fg="#6b7089"> | Topology: </span>
          <span fg="#bb9af7">{state.topology}</span>
        </text>
      </box>

      {/* Topology tree */}
      <box flexDirection="column" paddingX={1} paddingY={1}>
        {topologyLines.map((line, i) => (
          <box key={i} height={1}>
            <text fg={i === 0 ? "#9ece6a" : "#414868"}>{line}</text>
          </box>
        ))}
      </box>

      {/* Split list */}
      <box flexDirection="column" flexGrow={1} overflow="hidden">
        {state.splits.map((split, i) => (
          <SplitRow
            key={split.number}
            split={split}
            isSelected={i === selectedIndex}
            index={i}
            onSelect={setSelectedIndex}
          />
        ))}
      </box>

      {/* Detail panel */}
      <box flexDirection="column" paddingX={1} paddingY={1} borderColor="#292e42" border>
        {splits[selectedIndex] ? (
          <>
            <box height={1}>
              <text>
                <span fg="#bb9af7">{splits[selectedIndex].name}</span>
                <span fg="#9aa5ce"> | </span>
                <span fg="#7aa2f7">{splits[selectedIndex].files.length} files</span>
                <span fg="#9aa5ce"> | </span>
                <span fg="#c0caf5">{splits[selectedIndex].lines} lines</span>
                {splits[selectedIndex].dependsOn.length > 0 && (
                  <>
                    <span fg="#9aa5ce"> | depends on: </span>
                    <span fg="#e0af68">{splits[selectedIndex].dependsOn.join(", ")}</span>
                  </>
                )}
              </text>
            </box>
            <box height={1}>
              <text fg="#6b7089">
                Branch: {splits[selectedIndex].branch || "(not created)"}
              </text>
            </box>
          </>
        ) : (
          <box height={2}>
            <text fg="#9aa5ce">No split selected</text>
          </box>
        )}
        <box height={1}>
          {flash ? (
            <text fg="#9ece6a">{flash}</text>
          ) : (
            <text fg="#6b7089">Enter: open PR  c: copy URL  j/k: navigate  q: quit</text>
          )}
        </box>
      </box>
    </box>
  )
}
