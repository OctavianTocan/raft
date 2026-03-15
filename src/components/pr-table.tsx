import React from "react"
import type { PullRequest, Density, PRDetails } from "../lib/types"
import { formatRelativeAge, formatReviewStatus, formatLinesChanged, shortRepoName, truncate } from "../lib/format"
import type { GroupedData, GroupMode } from "../lib/grouping"
import { GroupHeader } from "./group-header"

interface PRTableProps {
  prs: PullRequest[]
  selectedIndex: number
  density: Density
  detailsMap?: Map<string, PRDetails>
  onSelect?: (index: number) => void
  groupedData?: GroupedData[] | null
  groupMode?: GroupMode
}

interface PRRowProps {
  pr: PullRequest
  isSelected: boolean
  index: number
  density: Density
  details?: PRDetails
  onSelect?: (index: number) => void
}

function renderReviewStatus(reviewStatusStr: string) {
  if (!reviewStatusStr) return null

  const parts: React.ReactNode[] = []
  const segments = reviewStatusStr.split(" ")

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    if (seg.startsWith("v")) {
      parts.push(<span key={i} fg="#9ece6a">{seg}</span>)
    } else if (seg.startsWith("x")) {
      parts.push(<span key={i} fg="#f7768e">{seg}</span>)
    } else {
      parts.push(<span key={i}>{seg}</span>)
    }
    if (i < segments.length - 1) {
      parts.push(<span key={`space-${i}`}> </span>)
    }
  }

  return parts
}

function PRRow({ pr, isSelected, index, density, details, onSelect }: PRRowProps) {
  const dotColor = pr.isDraft ? "#6b7089" : "#9ece6a"
  const dot = pr.isDraft ? "\u25CB" : "\u25CF"
  const cursor = isSelected ? "\u25B8" : " "
  const bgColor = isSelected ? "#292e42" : "transparent"
  const age = formatRelativeAge(pr.createdAt)
  const repo = shortRepoName(pr.repo)

  // Compressed mode: cursor + dot + PR# + title (30 chars)
  if (density === "compressed") {
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
        <box width={2}>
          <text fg={dotColor}>{dot}</text>
        </box>
        <box width={6}>
          <text fg="#7aa2f7">#{pr.number}</text>
        </box>
        <box flexGrow={1}>
          <text fg="#c0caf5">{truncate(pr.title, 30)}</text>
        </box>
      </box>
    )
  }

  // Compact mode: cursor + dot + PR# + repo + title + age
  if (density === "compact") {
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
          <text fg="#6b7089">{age}</text>
        </box>
      </box>
    )
  }

  // Normal mode: compact + review status + comment count
  if (density === "normal") {
    const reviewStatus = details ? formatReviewStatus(details.reviews) : ""
    const commentCount = details?.commentCount ?? 0

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
          <text fg="#c0caf5">{truncate(pr.title, 45)}</text>
        </box>
        <box width={8}>
          <text>{renderReviewStatus(reviewStatus)}</text>
        </box>
        {commentCount > 0 && (
          <box width={4}>
            <text fg="#9aa5ce">{commentCount}</text>
          </box>
        )}
        <box width={5}>
          <text fg="#6b7089">{age}</text>
        </box>
      </box>
    )
  }

  // Detailed mode: two lines per PR
  if (density === "detailed") {
    const reviewStatus = details ? formatReviewStatus(details.reviews) : ""
    const commentCount = details?.commentCount ?? 0
    const branch = details?.headRefName ?? pr.headRefName
    const additions = details?.additions ?? 0
    const deletions = details?.deletions ?? 0
    const linesChanged = formatLinesChanged(additions, deletions)

    return (
      <box
        flexDirection="column"
        backgroundColor={bgColor}
        onMouseDown={() => onSelect?.(index)}
      >
        {/* Line 1: Same as normal mode */}
        <box flexDirection="row" paddingX={1} height={1}>
          <box width={2}>
            <text fg={isSelected ? "#7aa2f7" : "#6b7089"}>{cursor}</text>
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
            <text fg="#c0caf5">{truncate(pr.title, 45)}</text>
          </box>
          <box width={8}>
            <text>{renderReviewStatus(reviewStatus)}</text>
          </box>
          {commentCount > 0 && (
            <box width={4}>
              <text fg="#9aa5ce">{commentCount}</text>
            </box>
          )}
          <box width={5}>
            <text fg="#6b7089">{age}</text>
          </box>
        </box>

        {/* Line 2: Indented branch + line changes */}
        <box flexDirection="row" paddingX={1} height={1}>
          <box width={32}>
            <text> </text>
          </box>
          <box width={40}>
            <text fg="#6b7089">{truncate(branch, 40)}</text>
          </box>
          <box flexGrow={1} />
          <box width={15}>
            <text>
              <span fg="#9ece6a">+{additions}</span>
              <span> </span>
              <span fg="#f7768e">-{deletions}</span>
            </text>
          </box>
        </box>
      </box>
    )
  }

  return null
}

export function PRTable({ prs, selectedIndex, density, detailsMap, onSelect, groupedData, groupMode }: PRTableProps) {
  if (prs.length === 0) {
    return (
      <box padding={2}>
        <text fg="#6b7089">No PRs match your filters.</text>
      </box>
    )
  }

  // Flat rendering (no grouping)
  if (groupMode === "none" || !groupedData) {
    return (
      <box flexDirection="column" width="100%">
        {prs.map((pr, i) => {
          const prKey = pr.url
          const details = detailsMap?.get(prKey)

          return (
            <PRRow
              key={prKey}
              pr={pr}
              isSelected={i === selectedIndex}
              index={i}
              density={density}
              details={details}
              onSelect={onSelect}
            />
          )
        })}
      </box>
    )
  }

  // Grouped rendering
  let prIndex = 0
  return (
    <box flexDirection="column" width="100%">
      {groupedData.map((group, groupIdx) => {
        if (group.type === "repo") {
          const groupPRs = group.prs
          return (
            <box key={groupIdx} flexDirection="column">
              <GroupHeader title={shortRepoName(group.repo)} count={groupPRs.length} width={100} />
              {groupPRs.map((pr) => {
                const isSelected = prIndex === selectedIndex
                const idx = prIndex
                prIndex++
                const details = detailsMap?.get(pr.url)
                return (
                  <PRRow
                    key={pr.url}
                    pr={pr}
                    isSelected={isSelected}
                    index={idx}
                    density={density}
                    details={details}
                    onSelect={onSelect}
                  />
                )
              })}
            </box>
          )
        }

        if (group.type === "stack") {
          const groupPRs = group.prs
          return (
            <box key={groupIdx} flexDirection="column">
              <GroupHeader title={`Stack: ${shortRepoName(group.repo)}`} count={groupPRs.length} width={100} />
              <box paddingX={2} height={1}>
                <text fg="#414868">● main</text>
              </box>
              {groupPRs.map((pr, stackIdx) => {
                const isSelected = prIndex === selectedIndex
                const idx = prIndex
                prIndex++

                const isLast = stackIdx === groupPRs.length - 1
                const connector = isLast ? "└── " : "├── "
                const bgColor = isSelected ? "#292e42" : "transparent"
                const cursor = isSelected ? "▸ " : "  "

                // Check if this is a StackedPR with position/stackSize
                const stackedPR = pr as any
                const hasStackInfo = "position" in stackedPR && "stackSize" in stackedPR

                return (
                  <box key={pr.url} flexDirection="row" paddingX={2} backgroundColor={bgColor}>
                    <box width={4}>
                      <text fg="#414868">{connector}</text>
                    </box>
                    <box width={2}>
                      <text fg={isSelected ? "#7aa2f7" : "transparent"}>{cursor}</text>
                    </box>
                    {hasStackInfo && (
                      <box width={8}>
                        <text fg="#bb9af7">[{stackedPR.position}/{stackedPR.stackSize}]</text>
                      </box>
                    )}
                    <box width={8}>
                      <text fg="#7aa2f7">#{pr.number}</text>
                    </box>
                    <box flexGrow={1}>
                      <text fg="#c0caf5">{pr.title}</text>
                    </box>
                    <box width={8}>
                      <text fg={pr.isDraft ? "#6b7089" : "#9ece6a"}>
                        {pr.isDraft ? "DRAFT" : "OPEN"}
                      </text>
                    </box>
                  </box>
                )
              })}
            </box>
          )
        }

        if (group.type === "standalone") {
          const groupPRs = group.prs
          return (
            <box key={groupIdx} flexDirection="column">
              <GroupHeader title="Standalone PRs" count={groupPRs.length} width={100} />
              {groupPRs.map((pr) => {
                const isSelected = prIndex === selectedIndex
                const idx = prIndex
                prIndex++
                const details = detailsMap?.get(pr.url)
                return (
                  <PRRow
                    key={pr.url}
                    pr={pr}
                    isSelected={isSelected}
                    index={idx}
                    density={density}
                    details={details}
                    onSelect={onSelect}
                  />
                )
              })}
            </box>
          )
        }

        if (group.type === "hierarchical") {
          return (
            <box key={groupIdx} flexDirection="column">
              <GroupHeader title={shortRepoName(group.repo)} count={group.stacks.flat().length + group.standalone.length} width={100} />

              {/* Render stacks */}
              {group.stacks.map((stackPRs, stackIdx) => (
                <box key={`stack-${stackIdx}`} flexDirection="column" paddingLeft={2}>
                  <box height={1}>
                    <text fg="#414868">  ● main</text>
                  </box>
                  {stackPRs.map((pr, prIdx) => {
                    const isSelected = prIndex === selectedIndex
                    const idx = prIndex
                    prIndex++

                    const isLast = prIdx === stackPRs.length - 1
                    const connector = isLast ? "  └── " : "  ├── "
                    const bgColor = isSelected ? "#292e42" : "transparent"
                    const cursor = isSelected ? "▸ " : "  "

                    const stackedPR = pr as any
                    const hasStackInfo = "position" in stackedPR && "stackSize" in stackedPR

                    return (
                      <box key={pr.url} flexDirection="row" paddingX={2} backgroundColor={bgColor}>
                        <box width={6}>
                          <text fg="#414868">{connector}</text>
                        </box>
                        <box width={2}>
                          <text fg={isSelected ? "#7aa2f7" : "transparent"}>{cursor}</text>
                        </box>
                        {hasStackInfo && (
                          <box width={8}>
                            <text fg="#bb9af7">[{stackedPR.position}/{stackedPR.stackSize}]</text>
                          </box>
                        )}
                        <box width={8}>
                          <text fg="#7aa2f7">#{pr.number}</text>
                        </box>
                        <box flexGrow={1}>
                          <text fg="#c0caf5">{pr.title}</text>
                        </box>
                        <box width={8}>
                          <text fg={pr.isDraft ? "#6b7089" : "#9ece6a"}>
                            {pr.isDraft ? "DRAFT" : "OPEN"}
                          </text>
                        </box>
                      </box>
                    )
                  })}
                </box>
              ))}

              {/* Render standalone PRs in this repo */}
              {group.standalone.length > 0 && (
                <box flexDirection="column" paddingLeft={2} paddingTop={1}>
                  <box paddingBottom={0.5}>
                    <text fg="#6b7089">Standalone:</text>
                  </box>
                  {group.standalone.map((pr) => {
                    const isSelected = prIndex === selectedIndex
                    const idx = prIndex
                    prIndex++
                    const details = detailsMap?.get(pr.url)
                    return (
                      <PRRow
                        key={pr.url}
                        pr={pr}
                        isSelected={isSelected}
                        index={idx}
                        density={density}
                        details={details}
                        onSelect={onSelect}
                      />
                    )
                  })}
                </box>
              )}
            </box>
          )
        }

        return null
      })}
    </box>
  )
}
