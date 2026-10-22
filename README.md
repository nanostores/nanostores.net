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

Docs come from other repositories, see [Deployment from other repositories](#deployment-from-other-repositories). Run `pnpm run fetch:upstream --refresh` to get their new releases, or replace `.upstream/<id>` with a symlink to your checkout to see unreleased changes. Do not edit `src/content/docs/docs/api/` or `dist/`.

## Checks

```sh
pnpm test
```

`test` runs formatting, unit and snippet tests, type checks and the production build with checks of pages, documentation exports, internal links and API anchors in parallel. CI runs the same command.

See [QA](docs/qa.md) for manual checks and additional commands, and [AGENTS.md](AGENTS.md) for contribution rules.

See [Analytics](docs/analytics.md) for the bundled Plausible tracker, event schema,
production origin gate, Nginx proxy and dashboard setup.

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

Docs and the API reference are built from the latest releases of the
repositories in [`src/config/upstream.json`](src/config/upstream.json).
A release is the tag of the `version` in `package.json`, like `1.5.5` or
`v0.3.4`. The build only reads their files, so a library can't run code
in our CI. After a release tag their workflows run:

```sh
gh workflow run ci.yml --repo nanostores/nanostores.net --ref main
```

See [the receiver](.github/workflows/ci.yml) and
[the sender](docs/upstream-signal.md#sender-workflow).
A daily build catches missed runs. `nanostores.net/upstream.json` shows
the deployed tags and commits.

- [Connect a library to the site](docs/upstream-signal.md)
- [Roll back docs](docs/rollback.md) when a library breaks them
