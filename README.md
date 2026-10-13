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

Documentation imports versioned Nano Stores and plugin READMEs from `src/vendor/`. Do not edit the build output in `dist/`.

## Checks

```sh
pnpm run format:check
pnpm run check
```

`check` builds the site and validates pages, documentation exports, internal links and anchors.

See [QA](docs/qa.md) for manual checks and additional commands, and [AGENTS.md](AGENTS.md) for contribution rules.

## Container

CI checks the static nginx image and publishes
`ghcr.io/nanostores/nanostores.net:latest` on pushes to `main` in this repository.

For `hplush/cloud`, make the image public and configure port `8000`, health path
`/`, and writable tmpfs `/var/lib/nginx/tmp`.
