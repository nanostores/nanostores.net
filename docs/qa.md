# QA

Mandatory automation builds the site and checks required output files, navigation links, HTML anchors and unique API IDs. Unit tests, types and executable examples are checked on demand. Visible code fragments, documentation export contents, browser layout, images, focus, native popovers, search and theme behavior are checked manually. Use the sections relevant to the change; run the full browser checklist before publishing a redesign.

## Check according to the change

| Change                                        | Required review beyond CI                                                                                                   |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Copy or situation metadata                    | Read the changed production page; check labels, claims and code-preview terms                                               |
| TypeScript, Astro components or configuration | Run `pnpm run check:types`; check affected pages or interactions                                                            |
| Displayed code example                        | Run `pnpm run check:snippets` and `pnpm run test:snippets`; verify the changed example's promised behavior and visible code |
| Dependencies                                  | Run `pnpm run test`, types and snippet checks; review generated docs, API, search and affected browser interactions         |
| Navigation or browser scripts                 | Check affected menus, popovers, Escape, focus, clipboard or demos                                                           |
| Styles, images or fonts                       | Check affected pages on phone and desktop, both themes and keyboard navigation                                              |
| README/API generation or docs navigation      | Run `pnpm run test`; inspect affected generated pages and exports; check production search and API anchors                  |
| Publishing                                    | Check search, canonical URLs, sitemap and indexing settings; measure performance after significant asset or layout changes  |

No general asset crawler, screenshot suite, coverage target or load tests are required. The build validates content schemas, referenced collection entries, vendored README versions and their local images. Avoid duplicating those checks in unit tests. Review accent-color use and Starlight CSS boundaries manually when styles or Starlight change.

## Automated checks

```sh
pnpm run format:check
pnpm run check
```

`check` creates a fresh `dist/` and runs `scripts/check-build.mjs` with Node. It requires nonempty home, docs, Getting started and API pages, plus all three `llms` exports. It checks navigation links (root-relative, relative and same-origin absolute URLs), same-page and cross-page HTML anchors, unique API IDs and local links in the exports, including Markdown reference links. External URLs are not fetched. Bare fragments inside combined exports have no source-page context and are reviewed with the affected documentation. HTML is parsed with `parse5`; no browser, DOM environment or test runner is launched. `test:build` is a compatibility alias for `check`.

## Unit tests, types and examples on demand

```sh
pnpm run test
pnpm run check:types
pnpm run check:snippets
pnpm run test:snippets
```

`test` runs the existing Vitest tests for documentation transforms, code-region extraction and the link checker. Run them when changing those helpers or their dependencies. For an extraction change, a targeted run is `pnpm run test -- src/lib/snippet-regions.test.ts`. These tests are outside mandatory CI. API helper tests use controlled examples; the build checks completeness against the installed package.

`check:types` runs Astro diagnostics. `check:snippets` checks executable TS, TSX and Vue examples; Svelte and text-only examples are reviewed manually. `test:snippets` executes the existing behavior tests, including the store test displayed on `/why/`. To narrow the behavior checks, pass a test path, such as `pnpm run test:snippets -- src/snippets/why/user.test.ts`. Snippet checks also apply when dependencies change without edits to the example files. Code fences in Markdown are reviewed manually.

The React rendering test on `/why/` is a text-only source at `src/snippets/why/before.test.tsx.txt`. It keeps TSX highlighting and the `Header.test.tsx` caption, but is neither compiled nor executed in this repository. When changing it or updating React, review the code and its visible output. If the behavior needs rechecking, copy it into a separate React/Vitest project with Testing Library, a DOM test environment and the component from `src/snippets/logic-outside-hooks/before.tsx`; confirm that the mocked user makes the rendered header show `Admin`. Renderer dependencies belong to that temporary check, not the site.

When changing an example, check its imports against the installed package, verify the shown result and any lifecycle cleanup, and read the visible region on the production page. For a situation, its preview `anchors` must name terms actually shown in the example or its stack, without repeating `landmarks`. These are editorial terms, separate from HTML link fragments. Review numeric claims against their source instead of pinning their current values in tests.

When changing regions, verify that the intended lines are shown, imports and scaffolding stay hidden, indentation is preserved and multiple Vue/markup regions join correctly. The build rejects missing sources and empty show regions; the visual meaning of a fragment is reviewed manually.

When changing documentation generation or export configuration, read the affected generated pages and `llms.txt`, `llms-full.txt` and `llms-small.txt`. Check that the entrypoint recommendations match the maintained handbook block, full/small membership follows the intended API and package exclusions, headings and order make sense, code indentation survives and internal generation markers are absent. These content checks are outside mandatory CI.

## Open the production build

After `check`, start a background preview on a free port:

```sh
pnpm run astro preview --background --host 127.0.0.1 --port 4324
```

Open the reported URL in an installed browser. Stop it afterward with `pnpm run astro preview stop`. Use a production preview for search checks: Pagefind's index is generated during the build. In a Dev Container use `--host 0.0.0.0` and forward the chosen port.

## Layout and images

- Open `/`, `/docs/getting-started/`, `/docs/api/`, `/ecosystem/` and `/why/` at widths around 390, 800 and 1440 px. Check the changed pages at 200% browser zoom too.
- Check that the header, paper and footer share their edges; phone paper fills the screen. Headings, code and illustrations stay inside the page without horizontal scrolling.
- Check meme crops and hover enlargement, illustration labels, font loading and readable code columns. The first homepage example is open; its columns stack when space runs out.
- When changing the header, resize around 800, 832 and 1100 px. Brand, search and navigation fit without clipping or overlap, and home/docs keep matching header positions.

## Starlight CSS review

When changing `src/styles/starlight.css`, `src/styles/header.css` or updating Starlight:

- Keep `starlight.css` focused on public `--sl-*` tokens, headings and article content under `.sl-markdown-content`.
- Keep `header.css` selectors scoped to our header markup and page layout. Review new dependencies on Starlight's internal classes, IDs or attributes.
- Prefer public tokens or component overrides. If a private selector is necessary, leave a comment explaining why no public option exists.
- Follow the header layout, search, mobile menu and keyboard checks in this checklist on the production preview.

## Interaction and keyboard

- Start with Tab: the skip link, navigation, section links and code controls have visible focus and lead through the page to Getting started and the footer.
- Open and close a code popover using its control, Close and Escape. Open another example and check that the previous popover closes.
- On phones, open and close the navigation menu. Links remain usable; closing the menu returns focus to its button, and the closed menu does not trap Tab.
- In Ecosystem, expand index groups, follow a section link and scroll. The current entry updates; the sidebar stays beside the article on wide screens. The mobile index closes after a selection.
- Follow a situation link, its back link, Getting started and an API anchor.

## API reference

After changes to TypeDoc or API transforms, review the affected sections in the production build:

- Confirm that the sidebar, index and article preserve the maintained API order. From Ecosystem, expand API and follow `atom`; from API, expand Ecosystem and follow React. Groups toggle without navigating, links reach the correct page and anchor, and other open groups survive the transition.
- Read `atom`, `computed` and `$store.setKey()` on a phone and desktop. Signatures and examples remain readable; open `Other overloads` and `Type details` to check that secondary information is available.
- Follow an index link and an API search result to the intended description; scroll through a long section and reopen the mobile menu to check that the current API entry stays highlighted and visible.

## Documentation and themes

- Check the mobile docs menu and on-page contents. Search appears only in Docs/API and Ecosystem; check that home, Why and situation pages have none. Follow a page and an API search result, then check `Ctrl/⌘ K`, Escape and focus return.
- Switch the system/browser emulation between light and dark. Paper, text, code and controls remain readable, and a reload starts with the matching theme.
- Disable JavaScript and reload home, docs and Ecosystem. Main content, links and code remain readable; the Ecosystem index can still be used.
- Check heading order, descriptive image labels, readable contrast and focus visibility with browser accessibility tools when changing those elements. Manual QA does not replace a full accessibility audit.

## Analytics and reporting

When changing analytics, use the dev server and inspect `[Nano Stores]` console events after a section view, code expansion and link click. Check the section, position and page fields. Production uses the no-op adapter.

Report the routes, browser, widths and interactions actually checked, automated results, and any checks left undone. Record screenshots when they help explain a layout issue; do not report the checklist as passed merely because unit tests passed.
