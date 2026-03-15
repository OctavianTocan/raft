import { MarkdownView } from "./markdown"

interface PanelBodyProps {
  body: string
  width: number
  scrollOffset: number
  maxLines: number
  onContentHeight?: (height: number) => void
}

export function PanelBody({ body, width, scrollOffset, maxLines, onContentHeight }: PanelBodyProps) {
  if (!body) {
    if (onContentHeight) onContentHeight(1)
    return (
      <box paddingX={1}>
        <text fg="#6b7089">No description provided.</text>
      </box>
    )
  }
  return <MarkdownView content={body} width={width} scrollOffset={scrollOffset} maxLines={maxLines} onContentHeight={onContentHeight} />
}
