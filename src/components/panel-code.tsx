/**
 * Panel tab for rendering inline code review comments on a PR.
 *
 * Each comment shows the author, file path, line number, a snippet of
 * the diff hunk for context, and the comment body. Designed to be wrapped
 * in a `<scrollbox>` by the parent for scrolling.
 */

import React from "react"
import type { CodeComment } from "../lib/types"
import { formatRelativeAge, truncate } from "../lib/format"

/** Props for the {@link PanelCode} component. */
interface PanelCodeProps {
  /** Array of inline code review comments to render. */
  codeComments: CodeComment[]
  /** Available width in columns. */
  width: number
}

/**
 * Renders all inline code review comments as styled cards with file context.
 *
 * @param props - See {@link PanelCodeProps}.
 */
export function PanelCode({ codeComments, width }: PanelCodeProps) {
  if (codeComments.length === 0) {
    return (
      <box paddingX={1}>
        <text fg="#6b7089">No code comments.</text>
      </box>
    )
  }

  return (
    <box flexDirection="column" width={width}>
      {codeComments.map((comment, idx) => {
        const age = formatRelativeAge(comment.createdAt)

        return (
          <box key={`cc-${idx}`} flexDirection="column" marginBottom={1}>
            {/* Header: author and timestamp */}
            <box height={1} paddingX={1}>
              <text>
                <span fg="#6b7089">{"\u250C"} </span>
                <span fg="#bb9af7">@{comment.author}</span>
                <span fg="#6b7089"> {"\u00B7"} {age}</span>
              </text>
            </box>

            {/* File path and line number */}
            <box height={1} paddingX={1}>
              <text>
                <span fg="#6b7089">{"\u2502"} </span>
                <span fg="#7aa2f7">{comment.path}</span>
                <span fg="#6b7089">:{comment.line}</span>
              </text>
            </box>

            {/* Diff hunk context (last line only) */}
            {comment.diffHunk && (
              <box height={1} paddingX={1}>
                <text>
                  <span fg="#6b7089">{"\u2502"} {">"} </span>
                  <span fg="#9aa5ce">
                    {truncate(comment.diffHunk.split("\n").pop() || "", width - 8)}
                  </span>
                </text>
              </box>
            )}

            {/* Blank separator before body */}
            <box height={1} paddingX={1}>
              <text fg="#6b7089">{"\u2502"}</text>
            </box>

            {/* Comment body */}
            {comment.body.split("\n").map((bodyLine, li) => (
              <box key={`cc-${idx}-${li}`} height={1} paddingX={1}>
                <text>
                  <span fg="#6b7089">{"\u2502"} </span>
                  <span fg="#c0caf5">{bodyLine}</span>
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
