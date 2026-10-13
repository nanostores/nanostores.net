// @ts-check
import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import starlight from '@astrojs/starlight'
import starlightLlmsTxt from 'starlight-llms-txt'
import pluginDocs from './src/config/plugin-docs.json' with { type: 'json' }
import { readLlmsGuidance } from './src/lib/llms-guidance.mjs'

const siteUrl = 'https://nanostores.net/'

// https://astro.build/config
export default defineConfig({
  site: siteUrl,
  // Keep the native Markdown parser beside its platform binding under pnpm.
  vite: { ssr: { external: ['satteri'] } },
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
        './src/styles/starlight.css',
      ],
      components: {
        PageFrame: './src/components/docs/PageFrame.astro',
        TwoColumnContent: './src/components/docs/TwoColumnContent.astro',
        PageSidebar: './src/components/docs/PageSidebar.astro',
        Header: './src/components/docs/Header.astro',
        MobileMenuToggle: './src/components/docs/MobileMenuToggle.astro',
        ThemeProvider: './src/components/docs/ThemeProvider.astro',
        ThemeSelect: './src/components/docs/ThemeSelect.astro',
        SocialIcons: './src/components/docs/SocialIcons.astro',
      },
      sidebar: [
        {
          label: 'Docs',
          items: [
            { label: 'Overview', link: '/docs/' },
            { label: 'Getting started', link: '/docs/getting-started/' },
          ],
        },
        {
          label: 'Core concepts',
          items: [{ autogenerate: { directory: 'docs/concepts' } }],
        },
        {
          label: 'Frameworks',
          items: [{ autogenerate: { directory: 'docs/frameworks' } }],
        },
        {
          label: 'Ecosystem',
          items: [{ autogenerate: { directory: 'docs/ecosystem' } }],
        },
        {
          label: 'Guides',
          items: [{ autogenerate: { directory: 'docs/guides' } }],
        },
        {
          label: 'Handbook',
          items: [{ autogenerate: { directory: 'docs/handbook' } }],
        },
      ],
      plugins: [
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
          // Small keeps the concepts, integrations and ecosystem overview;
          // detailed package READMEs remain in full and on the site.
          exclude: pluginDocs.map(({ slug }) => `docs/ecosystem/${slug}`),
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
