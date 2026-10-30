export interface Upstream {
  id: string
  repo: string
}

export function parseUpstream(data: unknown): Upstream[]
export function parsePins(
  text: string | undefined,
  upstream: { id: string }[],
): Map<string, string>
