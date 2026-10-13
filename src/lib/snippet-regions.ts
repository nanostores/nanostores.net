const marker = (name: string) =>
  new RegExp(String.raw`^\s*(?://|<!--)\s*#${name}\s*(?:-->)?\s*$`)
const start = marker('region show')
const end = marker('endregion')

// The lines between `#region show` and `#endregion` markers, dedented.
// A file may have several regions, joined in order, so a Vue component
// can show `<script setup>` and its template but hide imports and props.
// Markers are `//` comments in code and `<!-- -->` comments in markup.
export function showRegions(source: string) {
  const lines: string[] = []
  let shown = false
  for (const line of source.trimEnd().split(/\r?\n/)) {
    if (start.test(line)) shown = true
    else if (end.test(line)) shown = false
    else if (shown) lines.push(line)
  }
  const indent = Math.min(
    ...lines
      .filter((line) => line.trim())
      .map((line) => line.match(/^[\t ]*/)?.[0].length ?? 0),
  )
  return lines
    .map((line) => line.slice(indent))
    .join('\n')
    .trimEnd()
}
