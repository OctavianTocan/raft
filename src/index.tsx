#!/usr/bin/env bun
import { createCliRenderer } from "@opentui/core"
import { createRoot } from "@opentui/react"
import { useKeyboard, useRenderer } from "@opentui/react"
import { useState } from "react"
import { LsCommand } from "./commands/ls"
import { StackCommand } from "./commands/stack"

type Command = "ls" | "stack" | "stack-sync" | "home" | "help"

function parseArgs(argv: string[]): {
  command: Command
  author?: string
  repoFilter?: string
} {
  const args = argv.slice(2)
  const command = args[0] as string | undefined

  // --help or -h: plain text, no TUI
  if (args.includes("--help") || args.includes("-h")) {
    return { command: "help" }
  }

  let author: string | undefined
  let repoFilter: string | undefined
  let sync = false

  for (const arg of args.slice(1)) {
    if (arg.startsWith("--author=")) {
      author = arg.split("=")[1]
    } else if (arg.startsWith("--repo=")) {
      repoFilter = arg.split("=")[1]
    } else if (arg === "sync") {
      sync = true
    }
  }

  if (command === "ls") return { command: "ls", author, repoFilter }
  if (command === "stack") return { command: sync ? "stack-sync" : "stack", repoFilter }
  return { command: "home" }
}

function printHelp() {
  console.log(`raft - TUI for GitHub PR management

Usage:
  raft                     Interactive home screen
  raft ls                  List all your open PRs
  raft ls --repo=<name>    Filter PRs by repo name
  raft ls --author=<user>  List PRs by specific author
  raft stack               Show detected PR stacks
  raft stack sync          Rename PRs and update stack comments
  raft stack --repo=<repo> Stack for specific repo
  raft --help              Show this help message`)
}

function HomeScreen() {
  const renderer = useRenderer()
  const [activeCommand, setActiveCommand] = useState<Command | null>(null)

  useKeyboard((key) => {
    if (activeCommand) return // let the sub-command handle keys
    if (key.name === "q" || key.name === "escape") {
      renderer.destroy()
    }
  })

  if (activeCommand === "ls") return <LsCommand />
  if (activeCommand === "stack") return <StackCommand repo={undefined} sync={false} />
  if (activeCommand === "stack-sync") return <StackCommand repo={undefined} sync={true} />

  const commands = [
    { label: "List PRs", key: "ls" as Command, desc: "Browse all your open PRs", color: "#9ece6a" },
    { label: "View Stacks", key: "stack" as Command, desc: "Detect stacked PR chains", color: "#7aa2f7" },
    { label: "Sync Stacks", key: "stack-sync" as Command, desc: "Rename and link stacked PRs", color: "#e0af68" },
  ]

  return (
    <box flexDirection="column" padding={2}>
      <text>
        <span fg="#7aa2f7">
          <strong>raft</strong>
        </span>
        <span fg="#9aa5ce"> - TUI for GitHub PR management</span>
      </text>
      <box height={1} />
      <box flexDirection="column" gap={1}>
        {commands.map((cmd) => (
          <box
            key={cmd.key}
            flexDirection="row"
            paddingX={2}
            paddingY={1}
            border
            borderStyle="rounded"
            borderColor="#292e42"
            onMouseDown={() => setActiveCommand(cmd.key)}
          >
            <box width={16}>
              <text>
                <span fg={cmd.color}>
                  <strong>{cmd.label}</strong>
                </span>
              </text>
            </box>
            <box flexGrow={1}>
              <text fg="#9aa5ce">{cmd.desc}</text>
            </box>
          </box>
        ))}
      </box>
      <box height={1} />
      <text fg="#6b7089">Click a command or press q to exit. Use --help for CLI usage.</text>
    </box>
  )
}

const config = parseArgs(process.argv)

// --help: print to stdout and exit, no TUI
if (config.command === "help") {
  printHelp()
  process.exit(0)
}

const renderer = await createCliRenderer({
  exitOnCtrlC: false,
})

renderer.keyInput.on("keypress", (key) => {
  if (key.ctrl && key.name === "c") {
    renderer.destroy()
  }
})

const root = createRoot(renderer)

switch (config.command) {
  case "ls":
    root.render(<LsCommand author={config.author} repoFilter={config.repoFilter} />)
    break
  case "stack":
    root.render(<StackCommand repo={config.repoFilter} sync={false} />)
    break
  case "stack-sync":
    root.render(<StackCommand repo={config.repoFilter} sync={true} />)
    break
  default:
    root.render(<HomeScreen />)
    break
}
