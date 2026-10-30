// Release tags and commits of the upstream repositories in .upstream/,
// recorded by scripts/fetch-upstream.mjs. Run `pnpm run fetch:upstream` if it
// is missing.
import revisions from '../../.upstream/revisions.json'

export interface Revision {
  repo: string
  // null for a pinned commit or a local checkout
  tag?: string | null
  // null for a local checkout without Git history
  sha: string | null
  pinned?: boolean
  local?: boolean
}

export const upstreamRevisions: Record<string, Revision> = revisions

export function upstreamRevision(id: string): { repo: string; sha: string } {
  const revision = upstreamRevisions[id]
  if (!revision) {
    throw new Error(`.upstream/ has no ${id}. Run pnpm run fetch:upstream`)
  }
  return { repo: revision.repo, sha: revision.sha ?? 'HEAD' }
}
