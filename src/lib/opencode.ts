/**
 * Launch an Opencode AI session for a pull request.
 *
 * Spawns a headless `opencode run` session with a minimal prompt
 * (just PR number + repo) so Opencode can fetch details itself,
 * then opens the Opencode desktop app where the session appears.
 */

import type { PullRequest } from "./types"

/**
 * Launch an Opencode session for the given PR and open the desktop app.
 *
 * Fires and forgets: the opencode process runs in the background
 * and raft doesn't wait for it. The session shows up in the
 * Opencode desktop app immediately.
 *
 * @param pr - The pull request to review in Opencode
 */
export function launchOpencode(pr: PullRequest): void {
  const title = `PR #${pr.number}: ${pr.title}`
  const prompt = [
    `Review pull request #${pr.number} on ${pr.repo}.`,
    `URL: ${pr.url}`,
    `Clone the repo and check out the PR branch to review the code.`,
  ].join("\n")

  // Fire and forget: spawn opencode run in the background
  const proc = Bun.spawn(
    ["opencode", "run", "--title", title, prompt],
    { stdout: "ignore", stderr: "ignore", stdin: "ignore" },
  )
  // Detach so raft can exit independently
  proc.unref()

  // Open the Opencode desktop app so the user can see the session
  const app = Bun.spawn(
    ["open", "-a", "Opencode"],
    { stdout: "ignore", stderr: "ignore" },
  )
  app.unref()
}
