export interface Upstream {
  id: string
  repo: string
  ref?: string
}

export function parseUpstream(data: unknown): Upstream[]
export function parsePins(
  text: string | undefined,
  upstream: { id: string }[],
): Map<string, string>
