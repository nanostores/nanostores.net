import type { CollectionEntry } from 'astro:content'
import { apiGroups } from '../config/api-groups'
import { docsSections } from '../config/docs-navigation'
import { apiNavigation } from './api-reference'
import type { getEcosystemGroups } from './ecosystem'

export type NavigationEntry =
  | {
      type: 'link'
      label: string
      href: string
    }
  | {
      type: 'group'
      id: string
      label: string
      items: NavigationEntry[]
      collapsed?: boolean
    }

export const navigationSection = (path: string): string =>
  path === '/ecosystem' ||
  path.startsWith('/ecosystem/') ||
  path.startsWith('/docs/ecosystem')
    ? 'ecosystem'
    : path === '/docs/api' || path.startsWith('/docs/api/')
      ? 'api'
      : 'docs'

export function siteNavigation(
  docs: CollectionEntry<'docs'>[],
  ecosystem: Awaited<ReturnType<typeof getEcosystemGroups>>,
): NavigationEntry[] {
  const link = (label: string, href: string): NavigationEntry => ({
    type: 'link',
    label,
    href,
  })
  const group = (
    id: string,
    label: string,
    items: NavigationEntry[],
    collapsed = false,
  ): NavigationEntry => ({ type: 'group', id, label, items, collapsed })
  const pages = (directory: string): NavigationEntry[] =>
    docs
      .filter(
        (entry) =>
          !entry.data.sidebar.hidden &&
          (entry.id === directory || entry.id.startsWith(directory + '/')),
      )
      .sort(
        (a, b) =>
          (a.data.sidebar.order ?? Number.MAX_VALUE) -
            (b.data.sidebar.order ?? Number.MAX_VALUE) ||
          a.id.localeCompare(b.id),
      )
      .map((entry) =>
        link(entry.data.sidebar.label ?? entry.data.title, `/${entry.id}/`),
      )
  return [
    group(
      'docs',
      'Docs',
      [
        link('Overview', '/docs/'),
        link('Getting started', '/docs/getting-started/'),
        ...docsSections.map(({ label, directory }) =>
          group(directory, label, pages(directory)),
        ),
      ],
      true,
    ),
    group(
      'api',
      'API',
      [
        link('Overview', '/docs/api/'),
        ...apiNavigation(apiGroups).map((entry) =>
          group(
            `api/${entry.anchor}`,
            entry.label,
            entry.items.map(({ label, anchor }) =>
              link(label, `/docs/api/#${anchor}`),
            ),
            entry.label === 'Types' || entry.label === 'Deprecated',
          ),
        ),
      ],
      true,
    ),
    group(
      'ecosystem',
      'Ecosystem',
      [
        link('Overview', '/ecosystem/'),
        ...ecosystem.map((entry) =>
          group(`ecosystem/${entry.id}`, entry.title, [
            link('Overview', `/ecosystem/#${entry.id}`),
            ...entry.rows.map((row) => {
              if (!row.id)
                throw new Error(`Missing Ecosystem anchor: ${row.title}`)
              return link(row.indexTitle ?? row.title, `/ecosystem/#${row.id}`)
            }),
            ...(entry.more.length
              ? [link('More packages', '/ecosystem/#more-packages')]
              : []),
          ]),
        ),
        group('ecosystem/docs', 'Package docs', pages('docs/ecosystem'), true),
      ],
      true,
    ),
  ]
}
