/**
 * Shared DiffView component for rendering git diffs with syntax highlighting.
 *
 * Wraps OpenTUI's native `<diff>` element with Tokyo Night color theming
 * and automatic language detection. Follows the same architecture as
 * Critique (remorses/critique), which also uses OpenTUI's `<diff>`.
 */

import React, { useMemo } from "react"

/** Props for the {@link DiffView} component. */
export interface DiffViewProps {
  /** Unified diff string (with `---`/`+++` headers and `@@` hunks). */
  diff: string
  /** Display mode: side-by-side or interleaved. */
  view: "split" | "unified"
  /** Tree-sitter language name for syntax highlighting. */
  filetype?: string
}

/**
 * Renders a syntax-highlighted diff using OpenTUI's native `<diff>` component.
 *
 * Uses Tokyo Night color scheme for diff backgrounds and line numbers,
 * matching the rest of the raft TUI. The component is intentionally thin:
 * all logic for building the unified diff string and detecting filetypes
 * lives in `src/lib/diff-utils.ts`.
 *
 * @param props - See {@link DiffViewProps}.
 */
export function DiffView({ diff, view, filetype }: DiffViewProps) {
  // Memoize to avoid re-creating on every render
  const colors = useMemo(() => ({
    // Tokyo Night diff backgrounds
    addedBg: "#1a2e1a",
    removedBg: "#2e1a1a",
    contextBg: "#1a1b26",
    // Word-level highlighting (slightly brighter than line bg)
    addedContentBg: "#1a2e1a",
    removedContentBg: "#2e1a1a",
    // Line numbers
    lineNumberFg: "#565f89",
    lineNumberBg: "#1a1b26",
    addedLineNumberBg: "#1a2e1a",
    removedLineNumberBg: "#2e1a1a",
    // Text
    fg: "#c0caf5",
    panelBg: "#1a1b26",
  }), [])

  return (
    <box backgroundColor={colors.panelBg}>
      <diff
        diff={diff}
        view={view}
        fg={colors.fg}
        filetype={filetype}
        showLineNumbers
        wrapMode="word"
        addedBg={colors.addedBg}
        removedBg={colors.removedBg}
        contextBg={colors.contextBg}
        addedContentBg={colors.addedContentBg}
        removedContentBg={colors.removedContentBg}
        contextContentBg={colors.contextBg}
        lineNumberFg={colors.lineNumberFg}
        lineNumberBg={colors.lineNumberBg}
        addedLineNumberBg={colors.addedLineNumberBg}
        removedLineNumberBg={colors.removedLineNumberBg}
        selectionBg="#264F78"
        selectionFg="#FFFFFF"
      />
    </box>
  )
}
