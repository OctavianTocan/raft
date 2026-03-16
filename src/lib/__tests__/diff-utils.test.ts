import { test, expect, describe } from "bun:test"
import { buildUnifiedDiff, detectFiletype, getViewMode } from "../diff-utils"
import type { FileDiff } from "../types"

describe("buildUnifiedDiff", () => {
  test("wraps a modified file patch with --- and +++ headers", () => {
    const file: FileDiff = {
      filename: "src/app.ts",
      status: "modified",
      additions: 2,
      deletions: 1,
      changes: 3,
      patch: "@@ -1,3 +1,4 @@\n function hello() {\n+  console.log(\"hi\")\n+  console.log(\"bye\")\n-  return\n }",
    }
    const result = buildUnifiedDiff(file)
    expect(result).toStartWith("--- src/app.ts\n+++ src/app.ts\n@@")
    expect(result).toContain("+  console.log(\"hi\")")
    expect(result).toContain("-  return")
  })

  test("uses /dev/null for added files", () => {
    const file: FileDiff = {
      filename: "new-file.ts",
      status: "added",
      additions: 5,
      deletions: 0,
      changes: 5,
      patch: "@@ -0,0 +1,5 @@\n+line1\n+line2",
    }
    const result = buildUnifiedDiff(file)
    expect(result).toStartWith("--- /dev/null\n+++ new-file.ts\n@@")
  })

  test("uses /dev/null for removed files", () => {
    const file: FileDiff = {
      filename: "old-file.ts",
      status: "removed",
      additions: 0,
      deletions: 3,
      changes: 3,
      patch: "@@ -1,3 +0,0 @@\n-line1\n-line2\n-line3",
    }
    const result = buildUnifiedDiff(file)
    expect(result).toStartWith("--- old-file.ts\n+++ /dev/null\n@@")
  })

  test("uses previousFilename for renamed files", () => {
    const file: FileDiff = {
      filename: "new-name.ts",
      status: "renamed",
      additions: 1,
      deletions: 0,
      changes: 1,
      patch: "@@ -1,2 +1,3 @@\n line1\n+line2",
      previousFilename: "old-name.ts",
    }
    const result = buildUnifiedDiff(file)
    expect(result).toStartWith("--- old-name.ts\n+++ new-name.ts\n@@")
  })

  test("returns empty string for files with no patch", () => {
    const file: FileDiff = {
      filename: "binary.png",
      status: "modified",
      additions: 0,
      deletions: 0,
      changes: 0,
      patch: "",
    }
    const result = buildUnifiedDiff(file)
    expect(result).toBe("")
  })
})

describe("detectFiletype", () => {
  test("detects TypeScript files", () => {
    expect(detectFiletype("src/app.ts")).toBe("typescript")
    expect(detectFiletype("component.tsx")).toBe("typescript")
  })

  test("detects JavaScript files", () => {
    expect(detectFiletype("index.js")).toBe("typescript")
    expect(detectFiletype("app.jsx")).toBe("typescript")
    expect(detectFiletype("config.mjs")).toBe("typescript")
  })

  test("detects Python files", () => {
    expect(detectFiletype("main.py")).toBe("python")
    expect(detectFiletype("types.pyi")).toBe("python")
  })

  test("detects Rust files", () => {
    expect(detectFiletype("lib.rs")).toBe("rust")
  })

  test("detects Go files", () => {
    expect(detectFiletype("main.go")).toBe("go")
  })

  test("detects CSS/SCSS files", () => {
    expect(detectFiletype("styles.css")).toBe("css")
    expect(detectFiletype("theme.scss")).toBe("css")
  })

  test("detects YAML files", () => {
    expect(detectFiletype("config.yml")).toBe("yaml")
    expect(detectFiletype("ci.yaml")).toBe("yaml")
  })

  test("detects JSON files", () => {
    expect(detectFiletype("package.json")).toBe("json")
    expect(detectFiletype("tsconfig.jsonc")).toBe("json")
  })

  test("detects shell scripts", () => {
    expect(detectFiletype("deploy.sh")).toBe("bash")
    expect(detectFiletype("setup.bash")).toBe("bash")
  })

  test("returns undefined for unknown extensions", () => {
    expect(detectFiletype("file.xyz")).toBeUndefined()
    expect(detectFiletype("Makefile")).toBeUndefined()
  })
})

describe("getViewMode", () => {
  test("uses unified view for fully added files", () => {
    expect(getViewMode(10, 0, 200)).toBe("unified")
  })

  test("uses unified view for fully deleted files", () => {
    expect(getViewMode(0, 10, 200)).toBe("unified")
  })

  test("uses split view when terminal is wide enough", () => {
    expect(getViewMode(5, 3, 120)).toBe("split")
  })

  test("uses unified view when terminal is narrow", () => {
    expect(getViewMode(5, 3, 80)).toBe("unified")
  })

  test("respects custom split threshold", () => {
    expect(getViewMode(5, 3, 90, 80)).toBe("split")
    expect(getViewMode(5, 3, 90, 100)).toBe("unified")
  })
})
