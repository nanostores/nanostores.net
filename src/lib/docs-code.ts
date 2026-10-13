import type { ExpressiveCodePlugin } from '@expressive-code/core'
import type { Element, ElementContent } from 'hast'

// Public rendered-line hook mirrors the site's semantic dollar-store markers.
export function markDocStores(node: Element): void {
  node.children = node.children.flatMap((child): ElementContent[] => {
    if (child.type === 'element') {
      markDocStores(child)
      return [child]
    }
    if (child.type !== 'text') return [child]
    return child.value
      .split(/(\$\w+)/)
      .filter(Boolean)
      .map((value) =>
        /^\$\w+$/.test(value)
          ? {
              type: 'element',
              tagName: 'span',
              properties: { className: ['code-store'] },
              children: [{ type: 'text', value }],
            }
          : { type: 'text', value },
      )
  })
}
export const docsStoreMarkers: ExpressiveCodePlugin = {
  name: 'Nano Stores semantic markers',
  hooks: {
    postprocessRenderedLine: ({ renderData }) => {
      markDocStores(renderData.lineAst)
    },
  },
}
