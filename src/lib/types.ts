export interface PullRequest {
  number: number
  title: string
  url: string
  body: string
  state: string
  isDraft: boolean
  repo: string
  headRefName: string
  baseRefName: string
  createdAt: string
}

export interface StackedPR extends PullRequest {
  position: number
  stackSize: number
  originalTitle: string
}

export interface Stack {
  repo: string
  prs: StackedPR[]
}

export const STACK_COMMENT_MARKER = "<!-- pr-cli-stack -->"

export interface Review {
  user: string
  state: "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED" | "PENDING"
}

export interface PRDetails {
  additions: number
  deletions: number
  commentCount: number
  reviews: Review[]
  headRefName: string
}

export interface Comment {
  author: string
  body: string
  createdAt: string
  authorAssociation: string
}

export interface CodeComment {
  author: string
  body: string
  path: string
  line: number
  diffHunk: string
  createdAt: string
}

export interface PRPanelData {
  body: string
  comments: Comment[]
  codeComments: CodeComment[]
}

export type Density = "compact" | "normal" | "detailed" | "compressed"
export type PanelTab = "body" | "comments" | "code"
