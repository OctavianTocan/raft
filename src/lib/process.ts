/**
 * Safe subprocess spawning with automatic cleanup.
 *
 * All subprocess calls in raft converge through this module to prevent
 * file descriptor leaks. The safeSpawn() function ensures proc.kill()
 * and proc.unref() are always called, even on error paths - fixing the
 * segfault that occurred after ~72 seconds of rapid gh spawning.
 */

/** Result of a subprocess execution. */
export interface SpawnResult {
  stdout: string
  stderr: string
  exitCode: number
}

/** Options for safeSpawn, passed through to Bun.spawn. */
export interface SafeSpawnOpts {
  env?: Record<string, string | undefined>
  cwd?: string
}

/**
 * Spawn a subprocess with guaranteed cleanup of file descriptors.
 *
 * Wraps Bun.spawn() in a try/finally that calls proc.kill() and
 * proc.unref() to prevent fd accumulation. All stdout/stderr are
 * captured as trimmed strings.
 *
 * @param cmd - Command and arguments array (e.g. ["gh", "pr", "list"])
 * @param opts - Optional env and cwd overrides
 * @returns The process stdout, stderr, and exit code
 */
export async function safeSpawn(cmd: string[], opts?: SafeSpawnOpts): Promise<SpawnResult> {
  const proc = Bun.spawn(cmd, {
    stdout: "pipe",
    stderr: "pipe",
    env: opts?.env,
    cwd: opts?.cwd,
  })
  try {
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ])
    return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode }
  } finally {
    proc.kill()
    proc.unref()
  }
}

/**
 * Build a clean environment for GitHub CLI calls.
 *
 * Strips GITHUB_TOKEN and GH_TOKEN from the inherited environment so
 * the gh CLI uses its own keyring auth rather than tokens that Bun
 * auto-loads from .env files.
 *
 * @returns A copy of process.env without GitHub token variables.
 */
export function buildCleanEnv(): Record<string, string | undefined> {
  const cleanEnv = { ...process.env }
  delete cleanEnv.GITHUB_TOKEN
  delete cleanEnv.GH_TOKEN
  return cleanEnv
}
