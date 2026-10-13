import { z } from 'astro/zod'
import rawPluginDocs from '../config/plugin-docs.json'
import type { PluginDoc } from './plugin-docs'

const pluginDocSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  package: z.string().min(1),
  repo: z.string().regex(/^[\w.-]+\/[\w.-]+$/),
  tagPrefix: z.string(),
})

// Checks the shape of src/config/plugin-docs.json; a typo fails the build.
export function parsePluginDocs(data: unknown): PluginDoc[] {
  const result = z.array(pluginDocSchema).safeParse(data)
  if (!result.success) {
    throw new Error(
      `src/config/plugin-docs.json is invalid: ${z.prettifyError(result.error)}`,
    )
  }
  return result.data
}

export const pluginDocs = parsePluginDocs(rawPluginDocs)
