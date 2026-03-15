import { useState, useEffect } from "react"

const SHIMMER_CHARS = ["\u2591", "\u2592", "\u2593", "\u2592"]

interface SkeletonLineProps {
  width: number
  delay?: number
}

function SkeletonLine({ width, delay = 0 }: SkeletonLineProps) {
  const [frame, setFrame] = useState(0)
  const [started, setStarted] = useState(delay === 0)

  useEffect(() => {
    if (delay > 0) {
      const timeout = setTimeout(() => setStarted(true), delay)
      return () => clearTimeout(timeout)
    }
  }, [delay])

  useEffect(() => {
    if (!started) return
    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % (width + SHIMMER_CHARS.length))
    }, 60)
    return () => clearInterval(interval)
  }, [started, width])

  if (!started) return <box height={1} width={width} />

  const chars: string[] = []
  for (let i = 0; i < width; i++) {
    const shimmerPos = frame - i
    if (shimmerPos >= 0 && shimmerPos < SHIMMER_CHARS.length) {
      chars.push(SHIMMER_CHARS[shimmerPos])
    } else {
      chars.push("\u2591")
    }
  }

  return (
    <box height={1} width={width}>
      <text fg="#292e42">{chars.join("")}</text>
    </box>
  )
}

interface SkeletonRowProps {
  delay?: number
}

export function SkeletonRow({ delay = 0 }: SkeletonRowProps) {
  return (
    <box flexDirection="row" paddingX={1} height={1} gap={1}>
      <SkeletonLine width={2} delay={delay} />
      <SkeletonLine width={5} delay={delay + 30} />
      <SkeletonLine width={15} delay={delay + 60} />
      <SkeletonLine width={35} delay={delay + 90} />
      <SkeletonLine width={4} delay={delay + 120} />
    </box>
  )
}

interface SkeletonListProps {
  rows?: number
}

export function SkeletonList({ rows = 8 }: SkeletonListProps) {
  return (
    <box flexDirection="column" width="100%">
      {Array.from({ length: rows }, (_, i) => (
        <SkeletonRow key={i} delay={i * 50} />
      ))}
    </box>
  )
}
