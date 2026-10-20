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

Documentation and the API reference are built from the latest commits of the repositories in `src/config/upstream.json`; the build only reads their files. Run `pnpm run fetch:upstream --refresh` to get new commits, or replace `.upstream/<id>` with a symlink to your checkout. Do not edit `src/content/docs/docs/api/` or `dist/`.

## Checks

```sh
pnpm test
```

`test` runs formatting, unit and snippet tests, type checks and the production build with checks of pages, documentation exports, internal links and API anchors in parallel. CI runs the same command.

See [QA](docs/qa.md) for manual checks and additional commands, and [AGENTS.md](AGENTS.md) for contribution rules.

See [Analytics](docs/analytics.md) for the bundled Plausible tracker, event schema,
production origin gate, Nginx proxy and dashboard setup.

## Container

CI checks the static nginx image and publishes
`ghcr.io/nanostores/nanostores.net:latest` on pushes to `main` in this repository.

For `hplush/cloud`, make the image public and configure port `8000`, health path
`/`, and writable tmpfs `/var/lib/nginx/tmp`.
