import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { defineCollection, reference } from 'astro:content'
import type { Loader } from 'astro/loaders'
import { z } from 'astro/zod'
import { glob } from 'astro/loaders'
import { docsLoader } from '@astrojs/starlight/loaders'
import { docsSchema } from '@astrojs/starlight/schema'
import { coreRoutes, readmePages } from './lib/readme-docs'
import type { ReadmePage } from './lib/readme-docs'
import { pluginPage, upstreamImages } from './lib/plugin-docs'
import { upstreamRevision } from './lib/upstream-revisions'
import { relativeImagePaths } from './lib/plugin-images.mjs'
import { pluginDocs } from './lib/plugin-config'
import { withFacts } from './lib/readme'

const situations = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/situations' }),
  schema: z.object({
    kind: z.enum(['pair', 'situation']),
    label: z.string(),
    title: z.string(),
    subtitle: z.string().transform(withFacts),
    // One line under the home heading: why the usual way stops fitting.
    mechanism: z.string().transform(withFacts),
    secondLine: z.string().optional(),
    landmarks: z.array(z.string()),
    // Preview of the folded code: short terms the reader of this situation
    // already knows, their APIs or else their stack. Never Nano Stores APIs,
    // never repeating landmarks. Each one appears in the section's snippets.
    anchors: z.array(z.string()).min(1),
    boundary: z.object({
      text: z.string(),
      strong: z.string().optional(),
      // Shown on the home page too. One boundary there reads as confidence,
      // one per section reads as hedging, so keep this on a single section.
      home: z.boolean().optional(),
    }),
    toc: z.string(),
    seo: z.object({ title: z.string(), description: z.string() }),
    deep: z.object({
      recipe: z.array(z.object({ step: z.string(), file: z.string() })),
      limits: z.array(reference('objections')),
      beforeDependency: z.string(),
      plugins: z.array(reference('plugins')),
      proofs: z.array(reference('proofs')),
      next: z.array(reference('situations')),
    }),
  }),
})
const proofs = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/proofs' }),
  schema: z.object({
    claim: z.string().transform(withFacts),
    source: z.string().transform(withFacts),
    checkedAt: z.coerce.date(),
    status: z.enum(['verified', 'unverified']),
  }),
})
const objections = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/objections' }),
  schema: z.object({
    question: z.string(),
    answer: z.string(),
    alternative: z.string().optional(),
  }),
})
const plugins = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/plugins' }),
  schema: z.object({
    name: z.string(),
    package: z.string(),
    purpose: z.string(),
    // official = the nanostores GitHub org
    maintainer: z.enum(['official', 'community']).default('official'),
    repo: z.string().url(),
    docs: z.string().url(),
  }),
})
// Handwritten docs plus pages imported from the upstream READMEs.
const docsWithReadme: Loader = {
  name: 'docs-with-readme',
  async load(context) {
    await docsLoader().load(context)
    const root = context.config.root
    const upstreamReadme = (id: string) =>
      readFile(new URL(`.upstream/${id}/README.md`, root), 'utf8')
    const readme = await upstreamReadme('nanostores')
    const storePage = async (page: ReadmePage) => {
      const data = await context.parseData({
        id: page.id,
        data: {
          title: page.title,
          description: page.description,
          sidebar: { order: page.order, label: page.label },
        },
      })
      context.store.set({
        id: page.id,
        data,
        body: page.body,
        // Starlight builds the sidebar from file paths; these pages have none.
        filePath: `src/content/docs/${page.id}.md`,
        rendered: await context.renderMarkdown(page.body),
        digest: context.generateDigest(page.body),
      })
    }
    const core = upstreamRevision('nanostores')
    for (const page of readmePages(readme, core.sha)) await storePage(page)

    const coreLinks = coreRoutes(readme)
    for (const [index, plugin] of pluginDocs.entries()) {
      const pluginReadme = await upstreamReadme(plugin.id)
      for (const image of relativeImagePaths(pluginReadme)) {
        const file = new URL(
          `public${upstreamImages(plugin.id)}/${image}`,
          root,
        )
        if (!existsSync(file)) {
          throw new Error(
            `${plugin.package} README uses ${image}, which is not in ` +
              `${upstreamRevision(plugin.id).repo}`,
          )
        }
      }
      const source = { ...plugin, ...upstreamRevision(plugin.id) }
      await storePage(pluginPage(pluginReadme, source, index + 1, coreLinks))
    }
  },
}
const docs = defineCollection({ loader: docsWithReadme, schema: docsSchema() })
export const collections = { situations, proofs, objections, plugins, docs }
