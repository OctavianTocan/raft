import { safeSpawn, buildCleanEnv } from "./process"

let cachedToken: string | null = null;

export async function getGithubToken(): Promise<string> {
  if (cachedToken) {
    return cachedToken;
  }

  // Use the gh CLI to get the OAuth token, avoiding any .env leaks via buildCleanEnv
  const { stdout, exitCode, stderr } = await safeSpawn(["gh", "auth", "token"], {
    env: buildCleanEnv(),
  });

  if (exitCode !== 0) {
    throw new Error(`Failed to get GitHub token from gh CLI. Ensure you are logged in via 'gh auth login'. Error: ${stderr}`);
  }

  cachedToken = stdout.trim();
  return cachedToken;
}
