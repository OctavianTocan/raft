/**
 * Panel tab for rendering issue-level conversation comments on a PR.
 *
 * Each comment is displayed in a box-drawing card with author, timestamp,
 * and body. Bot comments are visually dimmed. Designed to be wrapped in
 * a `<scrollbox>` by the parent for scrolling.
 */

import React from "react"
import type { Comment } from "../lib/types"
import { formatRelativeAge } from "../lib/format"

/** Props for the {@link PanelComments} component. */
interface PanelCommentsProps {
  /** Array of issue-level comments to render. */
  comments: Comment[]
  /** Available width in columns. */
  width: number
}

/**
 * Renders all PR conversation comments as styled cards.
 *
 * @param props - See {@link PanelCommentsProps}.
 */
export function PanelComments({ comments, width }: PanelCommentsProps) {
  if (comments.length === 0) {
    return (
      <box paddingX={1}>
        <text fg="#6b7089">No comments.</text>
      </box>
    )
  }

  return (
    <box flexDirection="column" width={width}>
      {comments.map((comment, idx) => {
        const age = formatRelativeAge(comment.createdAt)
        // Dim bot comments so human comments stand out
        const isBot = comment.authorAssociation === "BOT" ||
                      comment.author.includes("[bot]") ||
                      comment.author.includes("bot")
        const authorColor = isBot ? "#6b7089" : "#bb9af7"
        const textColor = isBot ? "#6b7089" : "#c0caf5"

        return (
          <box key={`c-${idx}`} flexDirection="column" marginBottom={1}>
            {/* Header: author and timestamp */}
            <box height={1} paddingX={1}>
              <text>
                <span fg="#6b7089">{"\u250C"} </span>
                <span fg={authorColor}>@{comment.author}</span>
                <span fg="#6b7089"> {"\u00B7"} {age}</span>
              </text>
            </box>

            {/* Body lines */}
            {comment.body.split("\n").map((bodyLine, li) => (
              <box key={`c-${idx}-${li}`} height={1} paddingX={1}>
                <text>
                  <span fg="#6b7089">{"\u2502"} </span>
                  <span fg={textColor}>{bodyLine}</span>
                </text>
              </box>
            ))}

            {/* Footer */}
            <box height={1} paddingX={1}>
              <text fg="#6b7089">{"\u2514"}</text>
            </box>
          </box>
        )
      })}
    </box>
  )
}
