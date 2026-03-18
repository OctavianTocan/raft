import { fetchPRPanelData, fetchCIStatus, fetchReviewThreads } from "./github";
import { detectPRState } from "./pr-lifecycle";
import { generateFix, type ProposedFix } from "./ai-fix";
import { prepareShadowWorktree, cleanupShadowWorktree } from "./shadow";
import { cacheGeneratedFix, getGeneratedFixes } from "./db";
import { getCurrentRepo } from "./github";
import type { PullRequest, PRDetails } from "./types";
import { getRepoRoot } from "./git-utils";

// Simple in-memory flag to prevent multiple daemon runs simultaneously
let isDaemonRunning = false;

export async function runBackgroundDaemon(
  prs: PullRequest[], 
  detailsMap: Map<string, PRDetails>,
  onFixGenerated?: (url: string, threadId: string) => void
) {
  if (isDaemonRunning) return;
  isDaemonRunning = true;

  try {
    const repoRoot = await getRepoRoot();
    if (!repoRoot) return;

    for (const pr of prs) {
      const details = detailsMap.get(pr.url);
      if (!details) continue;

      const state = detectPRState(pr, details);
      
      if (state.state === "FIX_REVIEW" || state.state === "FIX_CI") {
        const existingFixes = getGeneratedFixes(pr.url);
        
        if (state.state === "FIX_REVIEW") {
          // See if we have an unresolved thread that we haven't generated a fix for
          const threads = await fetchReviewThreads(pr.repo, pr.number);
          const unresolvedThreads = threads.filter(t => !t.isResolved);
          
          for (const thread of unresolvedThreads) {
            if (existingFixes.some(f => f.threadId === thread.id)) continue; // Already generated
            
            // Generate fix
            try {
              const wtDir = await prepareShadowWorktree(repoRoot, pr.number);
              const fix = await generateFix(thread, wtDir);
              if (fix) {
                cacheGeneratedFix(pr.url, thread.id, fix);
                onFixGenerated?.(pr.url, thread.id);
              }
            } catch (e) {
              console.error(`Failed to generate fix for PR ${pr.number} thread ${thread.id}:`, e);
            }
          }
        } else if (state.state === "FIX_CI") {
          // CI failed.
          if (existingFixes.some(f => f.threadId === "ci")) continue; // Already generated
          
          try {
            const wtDir = await prepareShadowWorktree(repoRoot, pr.number);
            const fix = await generateCIFix(pr, wtDir);
            if (fix) {
              cacheGeneratedFix(pr.url, "ci", fix);
              onFixGenerated?.(pr.url, "ci");
            }
          } catch (e) {
            console.error(`Failed to generate CI fix for PR ${pr.number}:`, e);
          }
        }
      }
    }
  } finally {
    isDaemonRunning = false;
  }
}



/**
 * Placeholder for CI fixing AI logic.
 */
async function generateCIFix(pr: PullRequest, wtDir: string): Promise<any | null> {
  // For now, this is a stub. Real implementation would fetch GH action logs and prompt Claude.
  return null;
}
