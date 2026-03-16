import type { FileDiff } from "./types"

/**
 * Generates a semantic explanation of file changes using Claude Code headlessly.
 * Returns a 1-2 sentence summary of what changed and why.
 */
export async function explainFileDiff(file: FileDiff): Promise<string> {
  if (!file.patch) {
    return "Binary file or no changes to explain."
  }

  const prompt = `Explain what changed in this file in 1-2 clear sentences. Focus on the business logic/functionality, not implementation details.

Filename: ${file.filename}
Status: ${file.status}
Changes: +${file.additions} -${file.deletions}

Diff:
${file.patch}

Explanation:`

  try {
    const proc = Bun.spawn(["claude", "--no-input", prompt], {
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env },
    })

    const stdout = await new Response(proc.stdout).text()
    const exitCode = await proc.exited

    if (exitCode !== 0) {
      return "Failed to generate explanation."
    }

    // Extract the explanation (Claude Code may include formatting)
    const explanation = stdout.trim()
    return explanation || "No explanation generated."
  } catch (error) {
    console.error("Error calling Claude Code:", error)
    return "Error generating explanation."
  }
}

/**
 * Generates explanations for multiple files in parallel.
 * Returns a map of filename to explanation.
 */
export async function explainAllDiffs(files: FileDiff[]): Promise<Map<string, string>> {
  const results = new Map<string, string>()

  // Limit concurrency to avoid overwhelming the system
  const batchSize = 3
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize)
    const explanations = await Promise.all(
      batch.map(file => explainFileDiff(file))
    )

    for (let j = 0; j < batch.length; j++) {
      results.set(batch[j].filename, explanations[j])
    }
  }

  return results
}
