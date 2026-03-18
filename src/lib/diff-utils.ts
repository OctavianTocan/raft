/**
 * Diff utilities for rendering PR file diffs using OpenTUI's native `<diff>` component.
 *
 * Follows the same architecture as Critique (remorses/critique):
 * - Converts GitHub API patches to proper unified diff format
 * - Detects file language for Tree-sitter syntax highlighting
 * - Auto-selects split vs unified view based on terminal width
 */

import type { FileDiff } from "./types"

/**
 * Wraps a GitHub API patch string with proper unified diff headers.
 *
 * GitHub's REST API returns patches starting at `@@` hunk markers without
 * the `--- a/file` / `+++ b/file` headers that OpenTUI's `<diff>` component
 * expects. This function prepends those headers to create a valid unified diff.
 *
 * @param file - The file diff from the GitHub API.
 * @returns A complete unified diff string suitable for OpenTUI's `<diff>` component,
 *          or an empty string if the file has no patch content.
 */
export function buildUnifiedDiff(file: FileDiff): string {
  if (!file.patch) return ""

  const oldName = file.status === "added" ? "/dev/null" : file.filename
  const newName = file.status === "removed" ? "/dev/null" : file.filename

  // For renames, use the previous filename as the old side
  const oldDisplay = file.previousFilename ?? oldName

  return `--- ${oldDisplay}\n+++ ${newName}\n${file.patch}`
}

export type FileIntent = "Boilerplate" | "Config" | "Tests" | "Source Code"

export function getFileIntent(filename: string): FileIntent {
  const lower = filename.toLowerCase()
  if (
    lower.endsWith("yarn.lock") ||
    lower.endsWith("package-lock.json") ||
    lower.endsWith("pnpm-lock.yaml") ||
    lower.endsWith("cargo.lock") ||
    lower.endsWith("go.sum") ||
    lower.endsWith("gemfile.lock") ||
    lower.endsWith("poetry.lock") ||
    lower.endsWith(".svg") ||
    lower.endsWith(".png") ||
    lower.endsWith(".snap") ||
    lower.includes("generated")
  ) {
    return "Boilerplate"
  }

  if (
    lower.endsWith(".test.ts") ||
    lower.endsWith(".test.tsx") ||
    lower.endsWith(".test.js") ||
    lower.endsWith(".spec.ts") ||
    lower.endsWith(".spec.tsx") ||
    lower.endsWith(".spec.js") ||
    lower.includes("__tests__/") ||
    lower.includes("tests/") ||
    lower.includes("test/")
  ) {
    return "Tests"
  }

  if (
    lower.endsWith("package.json") ||
    lower.endsWith("tsconfig.json") ||
    lower.includes(".config.") ||
    lower.endsWith(".yml") ||
    lower.endsWith(".yaml") ||
    lower.endsWith(".toml") ||
    lower.endsWith(".ini") ||
    lower === "dockerfile" ||
    lower === "makefile"
  ) {
    return "Config"
  }

  return "Source Code"
}

/**
 * Detects the Tree-sitter language identifier from a filename's extension.
 *
 * Maps file extensions to the parser names recognized by OpenTUI's syntax
 * highlighting engine. Based on Critique's `detectFiletype` mapping with
 * coverage for common web, systems, and scripting languages.
 *
 * @param filePath - The file path or name to detect language for.
 * @returns The Tree-sitter language name, or `undefined` if the extension
 *          is not recognized.
 */
export function detectFiletype(filePath: string): string | undefined {
  const ext = filePath.split(".").pop()?.toLowerCase()
  switch (ext) {
    // TypeScript parser handles TS/TSX/JS/JSX as a superset
    case "ts":
    case "tsx":
    case "js":
    case "jsx":
    case "mjs":
    case "cjs":
    case "mts":
    case "cts":
      return "typescript"
    case "json":
    case "jsonc":
      return "json"
    case "md":
    case "mdx":
      return "markdown"
    case "py":
    case "pyw":
    case "pyi":
      return "python"
    case "rs":
      return "rust"
    case "go":
      return "go"
    case "cpp":
    case "cc":
    case "cxx":
    case "hpp":
    case "h":
      return "cpp"
    case "c":
      return "c"
    case "java":
      return "java"
    case "rb":
    case "rake":
      return "ruby"
    case "sh":
    case "bash":
    case "zsh":
      return "bash"
    case "html":
    case "htm":
    case "xml":
    case "svg":
      return "html"
    case "css":
    case "scss":
    case "less":
      return "css"
    case "yaml":
    case "yml":
      return "yaml"
    case "swift":
      return "swift"
    case "php":
      return "php"
    case "scala":
      return "scala"
    case "cs":
      return "csharp"
    default:
      return undefined
  }
}

/**
 * Determines whether to use split or unified diff view based on the
 * nature of changes and available terminal width.
 *
 * Follows Critique's logic:
 * - Files that are entirely added or deleted always use unified view
 *   (split would show one empty pane)
 * - Otherwise, split view is used when the terminal is wide enough
 *
 * @param additions - Number of added lines in the diff.
 * @param deletions - Number of deleted lines in the diff.
 * @param cols      - Available terminal width in columns.
 * @param splitThreshold - Minimum columns required for split view (default 100).
 * @returns `"split"` or `"unified"` view mode.
 */
export function getViewMode(
  additions: number,
  deletions: number,
  cols: number,
  splitThreshold: number = 100,
): "split" | "unified" {
  // Fully added or deleted files look wrong in split view (one side is empty)
  const isFullyAdded = additions > 0 && deletions === 0
  const isFullyDeleted = deletions > 0 && additions === 0
  if (isFullyAdded || isFullyDeleted) return "unified"

  return cols >= splitThreshold ? "split" : "unified"
}


