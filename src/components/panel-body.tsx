/**
 * Panel tab for rendering the PR description body as markdown.
 *
 * Delegates to {@link MarkdownView} for parsing and rendering.
 * Designed to be wrapped in a `<scrollbox>` by the parent for scrolling.
 */

import { MarkdownView } from "./markdown"

/** Props for the {@link PanelBody} component. */
interface PanelBodyProps {
  /** Raw markdown body text from the PR. */
  body: string
  /** Available width in columns. */
  width: number
}

/**
 * Renders the PR body as styled markdown, or a placeholder if empty.
 *
 * @param props - See {@link PanelBodyProps}.
 */
export function PanelBody({ body, width }: PanelBodyProps) {
  if (!body) {
    return (
      <box paddingX={1}>
        <text fg="#6b7089">No description provided.</text>
      </box>
    )
  }
  return <MarkdownView content={body} width={width} />
}
