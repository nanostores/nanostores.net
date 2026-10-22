# Roll back docs

When a library release breaks the docs, the `UPSTREAM_PINS` repository variable makes builds use given commits instead of the latest releases. Needs admin access to `nanostores/nanostores.net`.

## Find the last good commit

- **The build fails:** the site still runs the last good version. Take the SHA from [`nanostores.net/upstream.json`](https://nanostores.net/upstream.json).
- **The build passes, but a page is wrong:** open [CI runs on `main`](https://github.com/nanostores/nanostores.net/actions/workflows/ci.yml?query=branch%3Amain) → the last green run before the problem → **Summary**. Take the SHA of the previous release tag from the table.

The key is the `id` from [`src/config/upstream.json`](../src/config/upstream.json), for example `nanostores` for `nanostores/nanostores` or `query` for `nanostores/query`. Use the full 40-character SHA.

## Pin it

1. Open [`nanostores/nanostores.net` variables](https://github.com/nanostores/nanostores.net/settings/variables/actions) (Settings → Secrets and variables → Actions → **Variables**) → **New repository variable**. See [repository variables](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-variables#creating-configuration-variables-for-a-repository).
2. Name `UPSTREAM_PINS`, value:

   ```json
   { "nanostores": "72e14516001d419edb77f24da41caac90aa79a6e" }
   ```

   Pin several repositories with more keys, for example `{ "nanostores": "…", "query": "…" }`.

3. Open [CI](https://github.com/nanostores/nanostores.net/actions/workflows/ci.yml) → **Run workflow** → branch `main`. See [Manually running a workflow](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow).

The same with GitHub CLI ([`gh variable set`](https://cli.github.com/manual/gh_variable_set)):

```sh
gh variable set UPSTREAM_PINS --repo nanostores/nanostores.net --body '{"nanostores":"72e14516001d419edb77f24da41caac90aa79a6e"}'
gh workflow run ci.yml --repo nanostores/nanostores.net --ref main
```

Check: the CI summary marks the repository as `(pinned)`, and [`nanostores.net/upstream.json`](https://nanostores.net/upstream.json) shows `"pinned": true` for it. New pushes to the library rebuild the site with the same pin.

## Remove the pin

After the library is fixed:

1. Open [`nanostores/nanostores.net` variables](https://github.com/nanostores/nanostores.net/settings/variables/actions) → delete `UPSTREAM_PINS`.
2. Open [CI](https://github.com/nanostores/nanostores.net/actions/workflows/ci.yml) → **Run workflow** → branch `main`.

```sh
gh variable delete UPSTREAM_PINS --repo nanostores/nanostores.net
gh workflow run ci.yml --repo nanostores/nanostores.net --ref main
```

Check: [`nanostores.net/upstream.json`](https://nanostores.net/upstream.json) has no `"pinned"`.
