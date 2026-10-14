// @ts-check
import { defineConfig } from 'astro/config'
import { unified } from '@astrojs/markdown-remark'
import sitemap from '@astrojs/sitemap'
import starlight from '@astrojs/starlight'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import starlightTypeDoc from 'starlight-typedoc'
import starlightLlmsTxt from 'starlight-llms-txt'
import pluginDocs from './src/config/plugin-docs.json' with { type: 'json' }
import { apiGroups } from './src/config/api-groups.ts'
import { docsSections } from './src/config/docs-navigation.ts'
import { remarkApiLayout } from './src/lib/api-layout.ts'
import {
  apiOverview,
  apiSidebar,
  checkApiGroups,
  readApiExports,
} from './src/lib/api-reference.ts'
import { readLlmsGuidance } from './src/lib/llms-guidance.mjs'

const siteUrl = 'https://nanostores.net/'

const apiEntry = './node_modules/nanostores/index.d.ts'
const apiExports = readApiExports(apiEntry)
checkApiGroups(apiGroups, apiExports)
// TypeDoc renders its readme as /docs/api/, so the overview is written as one.
const apiOverviewFile = fileURLToPath(
  new URL('./node_modules/.cache/nanostores-site/api.md', import.meta.url),
)
mkdirSync(dirname(apiOverviewFile), { recursive: true })
writeFileSync(apiOverviewFile, apiOverview())

// Astro caches rendered Markdown. Plain metadata and a layout fingerprint
// invalidate that cache when comments, signatures or presentation change.
const apiLayoutCacheKey = createHash('sha256')
  .update(readFileSync(new URL('./src/lib/api-layout.ts', import.meta.url)))
  .update(readFileSync(new URL('./src/lib/api-reference.ts', import.meta.url)))
  .digest('hex')

// https://astro.build/config
export default defineConfig({
  site: siteUrl,
  // Keep the native Markdown parser beside its platform binding under pnpm.
  vite: { ssr: { external: ['satteri'] } },
  markdown: {
    processor: unified({
      remarkPlugins: [
        [
          remarkApiLayout,
          {
            groups: apiGroups,
            exports: Object.fromEntries(apiExports),
            cacheKey: apiLayoutCacheKey,
          },
        ],
      ],
    }),
  },
  integrations: [
    sitemap(),
    starlight({
      title: 'Nano Stores',
      description:
        "A tiny state manager for state that doesn't belong to one component.",
      // Same icon links as src/layouts/BaseLayout.astro.
      favicon: '/icon.svg',
      head: [
        {
          tag: 'link',
          attrs: { rel: 'icon', href: '/favicon.ico', sizes: '32x32' },
        },
        {
          tag: 'link',
          attrs: { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        },
        {
          tag: 'link',
          attrs: { rel: 'manifest', href: '/manifest.webmanifest' },
        },
      ],
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/nanostores/nanostores',
        },
      ],
      customCss: [
        './src/styles/tokens.css',
        './src/styles/roles.css',
        './src/styles/fonts.css',
        './src/styles/ornaments.css',
        './src/styles/header.css',
        './src/styles/navigation.css',
        './src/styles/navigation.css',
        './src/styles/starlight.css',
      ],
      components: {
        PageFrame: './src/components/docs/PageFrame.astro',
        TwoColumnContent: './src/components/docs/TwoColumnContent.astro',
        PageSidebar: './src/components/docs/PageSidebar.astro',
        Sidebar: './src/components/docs/Sidebar.astro',
        MobileMenuFooter: './src/components/docs/MobileMenuFooter.astro',
        Header: './src/components/docs/Header.astro',
        MobileMenuToggle: './src/components/docs/MobileMenuToggle.astro',
        ThemeProvider: './src/components/docs/ThemeProvider.astro',
        ThemeSelect: './src/components/docs/ThemeSelect.astro',
        SocialIcons: './src/components/docs/SocialIcons.astro',
      },
      routeMiddleware: './src/lib/docs-route-data.ts',
      sidebar: [
        {
          label: 'Docs',
          collapsed: true,
          items: [
            { label: 'Overview', link: '/docs/' },
            { label: 'Getting started', link: '/docs/getting-started/' },
            ...docsSections.map(({ label, directory }) => ({
              label,
              items: [{ autogenerate: { directory } }],
            })),
          ],
        },
        apiSidebar(),
        {
          label: 'Ecosystem',
          collapsed: true,
          items: [
            { label: 'All packages', link: '/ecosystem/' },
            { autogenerate: { directory: 'docs/ecosystem' } },
          ],
        },
      ],
      plugins: [
        starlightTypeDoc({
          entryPoints: [apiEntry],
          tsconfig: './tsconfig.docs.json',
          output: 'docs/api',
          typeDoc: {
            name: 'API reference',
            readme: apiOverviewFile,
            router: 'module',
            mergeReadme: true,
            useHTMLAnchors: true,
            cleanOutputDir: true,
            excludeInternal: true,
            // Keep parameter descriptions as headings for the API layout
            // and its stable, unique anchors.
            parametersFormat: 'list',
            useCodeBlocks: true,
            entryFileName: 'index',
            disableSources: true,
          },
        }),
        starlightLlmsTxt({
          projectName: 'Nano Stores',
          description:
            'A tiny state manager built around small atomic and derived stores. ' +
            'Use it for state and application logic shared across components ' +
            'or independent of a UI framework.',
          details:
            readLlmsGuidance(siteUrl) +
            '\n\nStart with ' +
            `[Getting started](${new URL('docs/getting-started/', siteUrl).href}). ` +
            `See the [Handbook](${new URL('docs/handbook/', siteUrl).href}) ` +
            'for the reasoning behind these conventions, and ' +
            `[Smart stores](${new URL('docs/concepts/smart-stores/', siteUrl).href}) ` +
            'for lifecycle patterns and reusable packages.',
          promote: [
            'docs',
            'docs/getting-started',
            'docs/handbook',
            'docs/handbook/**',
            'docs/concepts/smart-stores',
            'docs/concepts/**',
            'docs/frameworks/**',
          ],
          demote: ['docs/api', 'docs/api/**'],
          // Small keeps the concepts, integrations and ecosystem overview;
          // detailed package READMEs and the API remain in full and on the site.
          exclude: [
            'docs/api',
            'docs/api/**',
            ...pluginDocs.map(({ slug }) => `docs/ecosystem/${slug}`),
          ],
          minify: { whitespace: false },
          customSelectors: { all: ['.sl-anchor-link'] },
          optionalLinks: [
            {
              label: 'Use cases',
              url: siteUrl,
              description: 'Situations where Nano Stores may fit.',
            },
            {
              label: 'Ecosystem',
              url: new URL('ecosystem/', siteUrl).href,
              description: 'Available integrations and packages.',
            },
          ],
        }),
      ],
    }),
  ],
})
