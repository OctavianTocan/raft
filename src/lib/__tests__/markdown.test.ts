import { test, expect, describe } from "bun:test"
import { parseMarkdownLines } from "../../components/markdown"

describe("parseMarkdownLines", () => {
  test("parses headers as bold lines", () => {
    const lines = parseMarkdownLines("# Hello\n## World")
    expect(lines[0]).toEqual({ type: "header", text: "Hello", level: 1 })
    expect(lines[1]).toEqual({ type: "header", text: "World", level: 2 })
  })

  test("parses list items", () => {
    const lines = parseMarkdownLines("- item one\n* item two")
    expect(lines[0]).toEqual({ type: "list", text: "item one" })
    expect(lines[1]).toEqual({ type: "list", text: "item two" })
  })

  test("parses code blocks", () => {
    const lines = parseMarkdownLines("```\nconst x = 1\n```")
    expect(lines[0]).toEqual({ type: "code", text: "const x = 1" })
  })

  test("parses blank lines", () => {
    const lines = parseMarkdownLines("hello\n\nworld")
    expect(lines[0]).toEqual({ type: "text", text: "hello" })
    expect(lines[1]).toEqual({ type: "blank" })
    expect(lines[2]).toEqual({ type: "text", text: "world" })
  })

  test("parses plain text", () => {
    const lines = parseMarkdownLines("just text")
    expect(lines[0]).toEqual({ type: "text", text: "just text" })
  })
})
