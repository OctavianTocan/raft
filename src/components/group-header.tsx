interface GroupHeaderProps {
  title: string
  count: number
  width: number
}

export function GroupHeader({ title, count, width }: GroupHeaderProps) {
  const text = `─── ${title} (${count}) `
  const remaining = Math.max(0, width - text.length - 2)
  const line = text + "─".repeat(remaining)

  return (
    <box height={1} paddingX={1}>
      <text fg="#414868">{line}</text>
    </box>
  )
}
