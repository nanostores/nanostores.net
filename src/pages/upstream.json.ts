import type { APIRoute } from 'astro'
import { upstreamRevisions } from '../lib/upstream-revisions'

// Which commits this build was made from: the site itself (in CI) and every
// upstream repository, with `pinned: true` when UPSTREAM_PINS held it back.
export const GET: APIRoute = () =>
  new Response(
    `${JSON.stringify(
      {
        site: process.env.GITHUB_SHA ?? null,
        builtAt: new Date().toISOString(),
        upstream: upstreamRevisions,
      },
      null,
      2,
    )}\n`,
    { headers: { 'Content-Type': 'application/json' } },
  )
