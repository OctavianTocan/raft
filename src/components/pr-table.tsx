import type { PullRequest } from "../lib/types"
import { formatRelativeAge, shortRepoName, truncate } from "../lib/format"

interface PRTableProps {
  prs: PullRequest[]
  selectedIndex: number
}

function PRRow({ pr, isSelected }: { pr: PullRequest; isSelected: boolean }) {
  const dotColor = pr.isDraft ? "#565f89" : "#9ece6a"
  const dot = pr.isDraft ? "\u25CB" : "\u25CF"
  const cursor = isSelected ? "\u25B8" : " "
  const bgColor = isSelected ? "#292e42" : "transparent"
  const age = formatRelativeAge(pr.createdAt)
  const repo = shortRepoName(pr.repo)

  return (
    <box flexDirection="row" backgroundColor={bgColor} paddingX={1} height={1}>
      <box width={2}>
        <text fg={isSelected ? "#7aa2f7" : "#565f89"}>{cursor}</text>
      </box>
      <box width={2}>
        <text fg={dotColor}>{dot}</text>
      </box>
      <box width={6}>
        <text fg="#7aa2f7">#{pr.number}</text>
      </box>
      <box width={20}>
        <text fg="#bb9af7">{truncate(repo, 18)}</text>
      </box>
      <box flexGrow={1}>
        <text fg="#c0caf5">{truncate(pr.title, 60)}</text>
      </box>
      <box width={5}>
        <text fg="#565f89">{age}</text>
      </box>
    </box>
  )
}

export function PRTable({ prs, selectedIndex }: PRTableProps) {
  if (prs.length === 0) {
    return (
      <box padding={2}>
        <text fg="#565f89">No PRs match your filters.</text>
      </box>
    )
  }

  return (
    <box flexDirection="column" width="100%">
      {prs.map((pr, i) => (
        <PRRow key={`${pr.repo}-${pr.number}`} pr={pr} isSelected={i === selectedIndex} />
      ))}
    </box>
  )
}
