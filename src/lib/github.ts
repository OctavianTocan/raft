import type { PullRequest, PRDetails, Review, PRPanelData, Comment, CodeComment, FileDiff } from "./types"
import { STACK_COMMENT_MARKER } from "./types"
import { safeSpawn } from "./process"
import { hydrateCodeComments } from "./review-threads"
import { getGithubToken } from "./auth"

export async function fetchGh(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = await getGithubToken();
  const url = endpoint.startsWith("http") ? endpoint : `https://api.github.com/${endpoint.replace(/^\//, "")}`;
  
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/vnd.github.v3+json");
  }
  
  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API error ${response.status}: ${text}`);
  }
  
  if (response.status === 204) {
    return {};
  }
  
  return response.json();
}

export async function fetchGhGraphql(query: string, variables: any = {}): Promise<any> {
  const token = await getGithubToken();
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables })
  });

  if (!response.ok) {
    throw new Error(`GraphQL error ${response.status}: ${await response.text()}`);
  }

  const json = await response.json();
  if (json.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  }

  return json.data;
}

export function parseSearchResults(items: any[]): PullRequest[] {
  return items.map((pr) => {
    const firstLine = (pr.body ?? "").split("\n")[0] ?? "";
    const repoUrlParts = pr.repository_url.split("/");
    const repo = `${repoUrlParts[repoUrlParts.length - 2]}/${repoUrlParts[repoUrlParts.length - 1]}`;
    return {
      number: pr.number,
      title: pr.title,
      url: pr.html_url,
      body: firstLine.slice(0, 80),
      state: pr.state,
      isDraft: pr.draft || false,
      repo,
      headRefName: "",
      baseRefName: "",
      createdAt: pr.created_at,
      author: pr.user?.login,
    }
  });
}

export function stripStackPrefix(title: string): string {
  return title.replace(/^\[\d+\/\d+\]\s*/, "")
}

export async function getGhAccounts(): Promise<string[]> {
  // Not heavily used with fetch paradigm, just return dummy since token implies identity
  return ["@me"]
}

export async function fetchAllAccountPRs(
  onProgress?: (status: string) => void,
): Promise<PullRequest[]> {
  onProgress?.("Fetching PRs...");
  const json = await fetchGh("search/issues?q=is:pr+is:open+author:@me&per_page=100");
  return parseSearchResults(json.items);
}

export async function fetchOpenPRs(
  author?: string,
  onProgress?: (status: string) => void,
): Promise<PullRequest[]> {
  if (author === "") {
    onProgress?.("Fetching all open PRs...");
    const json = await fetchGh("search/issues?q=is:pr+is:open&per_page=100");
    return parseSearchResults(json.items);
  }
  if (author) {
    onProgress?.(`Fetching PRs for ${author}...`);
    const json = await fetchGh(`search/issues?q=is:pr+is:open+author:${author}&per_page=100`);
    return parseSearchResults(json.items);
  }
  return fetchAllAccountPRs(onProgress);
}

export async function fetchRepoPRs(repo: string): Promise<PullRequest[]> {
  try {
    const prs = await fetchGh(`repos/${repo}/pulls?state=open&per_page=100`);
    return prs.map((pr: any) => ({
      number: pr.number,
      title: pr.title,
      url: pr.html_url,
      body: (pr.body ?? "").split("\n")[0]?.slice(0, 80) ?? "",
      state: pr.state,
      isDraft: pr.draft || false,
      repo,
      headRefName: pr.head.ref,
      baseRefName: pr.base.ref,
      createdAt: pr.created_at,
    }));
  } catch {
    return [];
  }
}

export async function updatePRTitle(repo: string, prNumber: number, title: string): Promise<void> {
  await fetchGh(`repos/${repo}/pulls/${prNumber}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title })
  });
}

export async function findStackComment(repo: string, prNumber: number): Promise<number | null> {
  const comments = await fetchGh(`repos/${repo}/issues/${prNumber}/comments`);
  for (const c of comments) {
    if (c.body && c.body.includes(STACK_COMMENT_MARKER)) {
      return c.id;
    }
  }
  return null;
}

export async function upsertStackComment(
  repo: string,
  prNumber: number,
  body: string,
): Promise<void> {
  const existingId = await findStackComment(repo, prNumber)
  const fullBody = `${STACK_COMMENT_MARKER}\n${body}`
  
  if (existingId) {
    await fetchGh(`repos/${repo}/issues/comments/${existingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: fullBody })
    });
  } else {
    await fetchGh(`repos/${repo}/issues/${prNumber}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: fullBody })
    });
  }
}

export async function getCurrentRepo(): Promise<string | null> {
  try {
    const { stdout } = await safeSpawn(["git", "config", "--get", "remote.origin.url"]);
    const url = stdout.trim();
    const match = url.match(/github\.com[:/](.+?)(?:\.git)?$/);
    if (match) return match[1];
    return null;
  } catch {
    return null;
  }
}

export async function batchFetchPRDetails(prs: {repo: string, number: number, url: string}[]): Promise<Map<string, PRDetails>> {
  const resultMap = new Map<string, PRDetails>();
  if (prs.length === 0) return resultMap;

  // Chunk to avoid massive queries. Safe batch size: 20
  const CHUNK_SIZE = 20;
  for (let i = 0; i < prs.length; i += CHUNK_SIZE) {
    const chunk = prs.slice(i, i + CHUNK_SIZE);
    let query = "query {\\n";
    for (let j = 0; j < chunk.length; j++) {
      const pr = chunk[j];
      const [owner, name] = pr.repo.split("/");
      query += `
        pr_${j}: repository(owner: "${owner}", name: "${name}") {
          pullRequest(number: ${pr.number}) {
            additions
            deletions
            comments { totalCount }
            headRefName
            headRefOid
            mergeable
            reviews(first: 100) {
              nodes {
                author { login }
                state
              }
            }
            reviewThreads(first: 100) {
              nodes {
                isResolved
              }
            }
            commits(last: 1) {
              nodes {
                commit {
                  statusCheckRollup {
                    state
                  }
                }
              }
            }
          }
        }
      `;
    }
    query += "}";

    try {
      const data = await fetchGhGraphql(query);
      for (let j = 0; j < chunk.length; j++) {
        const pr = chunk[j];
        const prData = data[`pr_${j}`]?.pullRequest;
        if (!prData) continue;

        const reviews: Review[] = (prData.reviews?.nodes || []).map((r: any) => ({
          user: r.author?.login || "unknown",
          state: r.state
        }));

        const unresolvedThreadCount = (prData.reviewThreads?.nodes || [])
          .filter((t: any) => !t.isResolved).length;

        const checkState = prData.commits?.nodes?.[0]?.commit?.statusCheckRollup?.state;
        let ciStatus: "ready" | "pending" | "failing" | "unknown" = "unknown";
        if (checkState === "SUCCESS") ciStatus = "ready";
        else if (checkState === "PENDING") ciStatus = "pending";
        else if (checkState === "FAILURE" || checkState === "ERROR") ciStatus = "failing";

        const hasConflicts = prData.mergeable === "CONFLICTING";

        resultMap.set(pr.url, {
          additions: prData.additions,
          deletions: prData.deletions,
          commentCount: prData.comments?.totalCount || 0,
          reviews,
          headRefName: prData.headRefName,
          unresolvedThreadCount,
          ciStatus,
          hasConflicts,
        });
      }
    } catch (e) {
      console.error("GraphQL batch failed:", e);
    }
  }

  return resultMap;
}

export async function fetchPRDetails(repo: string, prNumber: number): Promise<PRDetails> {
  const map = await batchFetchPRDetails([{repo, number: prNumber, url: `https://github.com/${repo}/pull/${prNumber}`}]);
  const details = map.get(`https://github.com/${repo}/pull/${prNumber}`);
  if (!details) throw new Error("Failed to fetch PR details");
  return details;
}

export async function fetchPRPanelData(repo: string, prNumber: number): Promise<PRPanelData> {
  const [prData, issueComments, codeComments, files, reviewThreads] = await Promise.all([
    fetchGh(`repos/${repo}/pulls/${prNumber}`),
    fetchGh(`repos/${repo}/issues/${prNumber}/comments`),
    fetchGh(`repos/${repo}/pulls/${prNumber}/comments`),
    fetchGh(`repos/${repo}/pulls/${prNumber}/files?per_page=100`),
    fetchReviewThreads(repo, prNumber),
  ]);

  const body = prData.body || "";
  const comments: Comment[] = (issueComments || []).map((c: any) => ({
    author: c.user?.login || "unknown",
    body: c.body,
    createdAt: c.created_at,
    authorAssociation: c.author_association
  }));

  const rawCodeComments = (codeComments || []).map((c: any) => ({
    id: c.id,
    author: c.user?.login || "unknown",
    body: c.body,
    path: c.path,
    line: c.line || c.original_line || 0,
    diffHunk: c.diff_hunk,
    createdAt: c.created_at
  }));

  const codeCommentsHydrated = hydrateCodeComments(rawCodeComments, reviewThreads);
  
  const formattedFiles: FileDiff[] = (files || []).map((f: any) => ({
    filename: f.filename,
    status: f.status,
    additions: f.additions,
    deletions: f.deletions,
    changes: f.changes,
    patch: f.patch,
    previousFilename: f.previous_filename
  }));

  return { body, comments, codeComments: codeCommentsHydrated, files: formattedFiles };
}

export type ReviewEvent = "APPROVE" | "REQUEST_CHANGES" | "COMMENT"

export async function submitPRReview(
  repo: string,
  prNumber: number,
  event: ReviewEvent,
  body?: string,
): Promise<void> {
  await fetchGh(`repos/${repo}/pulls/${prNumber}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ? { event, body } : { event })
  });
}

export async function replyToReviewComment(
  repo: string,
  prNumber: number,
  commentId: number,
  body: string,
): Promise<void> {
  await fetchGh(`repos/${repo}/pulls/${prNumber}/comments/${commentId}/replies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body })
  });
}

export async function postPRComment(
  repo: string,
  prNumber: number,
  body: string,
): Promise<void> {
  await fetchGh(`repos/${repo}/issues/${prNumber}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body })
  });
}

export interface ReviewThread {
  id: string
  isResolved: boolean
  comments: Array<{
    id: number
    author: string
    body: string
    path: string
    line: number | null
    createdAt: string
  }>
}

export async function fetchReviewThreads(repo: string, prNumber: number): Promise<ReviewThread[]> {
  const [owner, name] = repo.split("/")
  const query = `query($owner: String!, $name: String!, $number: Int!) {
    repository(owner: $owner, name: $name) {
      pullRequest(number: $number) {
        reviewThreads(first: 100) {
          nodes {
            id
            isResolved
            comments(first: 50) {
              nodes {
                databaseId
                author { login }
                body
                path
                line
                createdAt
              }
            }
          }
        }
      }
    }
  }`

  const data = await fetchGhGraphql(query, { owner, name, number: prNumber });
  const threads = data.repository?.pullRequest?.reviewThreads?.nodes ?? [];
  return threads.map((t: any) => ({
    id: t.id,
    isResolved: t.isResolved,
    comments: (t.comments?.nodes ?? []).filter((c: any) => c.databaseId != null).map((c: any) => ({
      id: c.databaseId,
      author: c.author?.login ?? "unknown",
      body: c.body,
      path: c.path,
      line: c.line,
      createdAt: c.createdAt,
    })),
  }));
}

export async function resolveReviewThread(threadId: string): Promise<void> {
  const query = `mutation {
    resolveReviewThread(input: { threadId: "${threadId}" }) {
      thread { id isResolved }
    }
  }`
  await fetchGhGraphql(query);
}

export async function fetchCIStatus(repo: string, ref: string): Promise<"ready" | "pending" | "failing" | "unknown"> {
  try {
    const checks: any = await fetchGh(`repos/${repo}/commits/${ref}/check-runs`);
    const checkRuns = checks.check_runs || [];
    if (checkRuns.length === 0) return "ready";
    if (checkRuns.some((c: any) => ["failure", "timed_out", "cancelled", "action_required"].includes(c.conclusion ?? ""))) return "failing";
    if (checkRuns.some((c: any) => c.status !== "completed")) return "pending";
    return "ready";
  } catch {
    return "unknown";
  }
}

export async function fetchHasConflicts(repo: string, prNumber: number): Promise<boolean> {
  try {
    const pr: any = await fetchGh(`repos/${repo}/pulls/${prNumber}`);
    return pr.mergeable === false || pr.mergeable_state === "dirty";
  } catch {
    return false;
  }
}
