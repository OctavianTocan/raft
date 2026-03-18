import { join } from "node:path";
import { safeSpawn } from "./process";

/**
 * Ensures a shadow worktree exists for a given PR.
 * Returns the absolute path to the worktree.
 */
export async function prepareShadowWorktree(repoRoot: string, prNumber: number): Promise<string> {
  const shadowDir = join(repoRoot, ".raft-shadow");
  const wtDir = join(shadowDir, `pr-${prNumber}`);
  const branchName = `raft-shadow/pr-${prNumber}`;

  // Ensure .raft-shadow exists and is ignored
  try {
    await Bun.write(join(shadowDir, ".gitignore"), "*\n");
  } catch {}

  // Fetch the PR head
  // Assuming 'origin' is the remote name. In a more robust setup we might need to parse remote.
  // But for now, we'll fetch from origin or try to fetch the PR head directly.
  try {
    await safeSpawn(["git", "fetch", "origin", `pull/${prNumber}/head:${branchName}`], { cwd: repoRoot });
  } catch (e) {
    // If origin fails, try upstream or just generic fetch?
    // Let's assume origin for now.
    throw new Error(`Failed to fetch PR ${prNumber} head: ${e}`);
  }

  // Check if worktree already exists
  const { stdout: wtList } = await safeSpawn(["git", "worktree", "list"], { cwd: repoRoot });
  if (wtList.includes(wtDir)) {
    // Worktree already exists, just reset it to the fetched branch
    await safeSpawn(["git", "reset", "--hard", branchName], { cwd: wtDir });
    return wtDir;
  }

  // Create the worktree
  await safeSpawn(["git", "worktree", "add", wtDir, branchName], { cwd: repoRoot });

  return wtDir;
}

/**
 * Removes the shadow worktree and the shadow branch.
 */
export async function cleanupShadowWorktree(repoRoot: string, prNumber: number): Promise<void> {
  const shadowDir = join(repoRoot, ".raft-shadow");
  const wtDir = join(shadowDir, `pr-${prNumber}`);
  const branchName = `raft-shadow/pr-${prNumber}`;

  try {
    await safeSpawn(["git", "worktree", "remove", "--force", wtDir], { cwd: repoRoot });
  } catch {}

  try {
    await safeSpawn(["git", "branch", "-D", branchName], { cwd: repoRoot });
  } catch {}
}
