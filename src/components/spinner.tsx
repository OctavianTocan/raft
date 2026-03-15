import { useState, useEffect } from "react"

const FRAMES = ["\u280B", "\u2819", "\u2839", "\u2838", "\u283C", "\u2834", "\u2826", "\u2827", "\u2807", "\u280F"]

interface SpinnerProps {
  text: string
  color?: string
}

export function Spinner({ text, color = "#7aa2f7" }: SpinnerProps) {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % FRAMES.length)
    }, 80)
    return () => clearInterval(interval)
  }, [])

  return (
    <text>
      <span fg={color}>{FRAMES[frame]}</span>
      <span fg="#9aa5ce"> {text}</span>
    </text>
  )
}
