# Nano Stores website

Marketing website and documentation, built with Astro and Starlight.

## Development

With Docker running, open this repository folder in a Dev Container.

```sh
pnpm install --frozen-lockfile
pnpm start
```

Open forwarded port 4321 in your browser. The server runs in the terminal and shows its logs; stop it with `Ctrl+C`.

## Source

- `src/pages/` — homepage and other routes.
- `src/content/` — documentation and situation copy.
- `src/components/` and `src/styles/` — UI and styles.
- `src/snippets/` — displayed code examples.

Docs come from other repositories, see [Deployment from other repositories](#deployment-from-other-repositories). Run `pnpm run fetch:upstream --refresh` to get their new commits, or replace `.upstream/<id>` with a symlink to your checkout. Do not edit `src/content/docs/docs/api/` or `dist/`.

## Checks

```sh
pnpm test
```

`test` runs formatting, unit and snippet tests, type checks and the production build with checks of pages, documentation exports, internal links and API anchors in parallel. CI runs the same command.

See [QA](docs/qa.md) for manual checks and additional commands, and [AGENTS.md](AGENTS.md) for contribution rules.

## Deploy

The site is a static nginx image, `ghcr.io/nanostores/nanostores.net`.

- **Production:** `main` is on `nanostores.net`.
- **Pull request preview:** add the `deploy-preview` label; CI deploys
  the pull request to `preview-<number>.nanostores.hplush.dev`.

To build and run the image locally:

```sh
pnpm run build
docker build -t nanostores-site .
docker run --rm -p 8000:8000 nanostores-site
```

For `hplush/cloud`, make the image public and configure port `8000`,
health path `/`, and writable tmpfs `/var/lib/nginx/tmp`.

### Deployment from other repositories

Docs and the API reference are built from the latest commits of the
repositories in [`src/config/upstream.json`](src/config/upstream.json).
The build only reads their files, so a library can't run code in our CI.
After a push to `main` their workflows run:

```sh
gh workflow run ci.yml --repo nanostores/nanostores.net --ref main
```

See [the receiver](.github/workflows/ci.yml) and
[a sender](https://github.com/nanostores/nanostores/blob/main/.github/workflows/site.yml).
A daily build catches missed runs. `nanostores.net/upstream.json` shows
the deployed commits.

To connect another repository, add it to `upstream.json`, copy the sender
workflow and give it the `SITE_NOTIFIER_KEY` organization secret
(App with `Actions: write` on this repository only). For an ecosystem
page, also add it to [`src/config/plugin-docs.json`](src/config/plugin-docs.json).

To roll back docs, set the `UPSTREAM_PINS` repository variable to
`{"<id>":"<full SHA>"}` and rerun CI; delete it after the fix.
