# Connect a library to the site

After a release tag, a library starts the site build with a GitHub App token, not a personal token:

- **You create** the `nanostores-site-notifier` App and store its private key as `SITE_NOTIFIER_KEY`.
- **On each run** the [`actions/create-github-app-token`](https://github.com/actions/create-github-app-token) step exchanges the key for a 1-hour token that can only start workflows in `nanostores/nanostores.net`.

## Create the App

**Once for the organization.** You need to be an owner of the `nanostores` organization. GitHub guide: [Registering a GitHub App](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app).

1. Open [new GitHub App](https://github.com/organizations/nanostores/settings/apps/new) (the `nanostores` organization → Settings → Developer settings → GitHub Apps → **New GitHub App**).
2. Name `nanostores-site-notifier`, Homepage URL `https://nanostores.net`. Webhook: uncheck **Active**.
3. Repository permissions → **Actions: Read and write**. Leave everything else at No access.
4. Where can this App be installed: **Only on this account**. Click **Create GitHub App**.
5. General → About: copy the **Client ID**.
6. Private keys → **Generate a private key**. The browser downloads a `.pem` file. See [Managing private keys](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/managing-private-keys-for-github-apps#generating-private-keys).
7. Install App (left menu) → **Install** next to the `nanostores` organization → **Only select repositories** → `nanostores/nanostores.net`. See [Installing your own GitHub App](https://docs.github.com/en/apps/using-github-apps/installing-your-own-github-app).
8. In the `nanostores` organization settings → Secrets and variables → Actions:
   - [Secrets](https://github.com/organizations/nanostores/settings/secrets/actions) → **New organization secret**: `SITE_NOTIFIER_KEY`, the whole `.pem` file. Repository access: **Selected repositories**, the libraries, for example `nanostores/nanostores` and `nanostores/query`. See [organization secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets#creating-secrets-for-an-organization).
   - [Variables](https://github.com/organizations/nanostores/settings/variables/actions) → **New organization variable**: `SITE_NOTIFIER_CLIENT_ID`, the Client ID, with the same repositories. See [organization variables](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-variables#creating-configuration-variables-for-an-organization).
9. Delete the `.pem` file.

If the key leaks: App page → Private keys → **Generate a private key**, replace the `SITE_NOTIFIER_KEY` value with the new file, then [delete the old key](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/managing-private-keys-for-github-apps#deleting-private-keys).

## Connect a library

**For every library.**

Example: `nanostores/router`.

1. Add `{ "id": "router", "repo": "nanostores/router" }` to [`src/config/upstream.json`](../src/config/upstream.json). For an ecosystem page, also add it to [`src/config/plugin-docs.json`](../src/config/plugin-docs.json) with the same `id`.
2. In the `nanostores` organization [secrets](https://github.com/organizations/nanostores/settings/secrets/actions), open `SITE_NOTIFIER_KEY` → Repository access → add `nanostores/router`. Do the same for `SITE_NOTIFIER_CLIENT_ID` in [variables](https://github.com/organizations/nanostores/settings/variables/actions).
3. Add [the sender workflow](#sender-workflow) to `nanostores/router` as `.github/workflows/site.yml`.

> [!IMPORTANT]
> Repositories outside `nanostores`, like `psd-coder/nanostores-devtools`, can't use secrets of the `nanostores` organization. They get updates only from the daily build.

### Sender workflow

`.github/workflows/site.yml` in the library, for example `nanostores/router`. It uses [`actions/create-github-app-token`](https://github.com/actions/create-github-app-token) and [`gh workflow run`](https://cli.github.com/manual/gh_workflow_run):

```yaml
name: Site
on:
  push:
    tags: ['*']
permissions: {}
jobs:
  notify:
    name: Rebuild nanostores.net
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: Get a token of the notifier App
        id: token
        uses: actions/create-github-app-token@bcd2ba49218906704ab6c1aa796996da409d3eb1 # v3.2.0
        with:
          client-id: ${{ vars.SITE_NOTIFIER_CLIENT_ID }}
          private-key: ${{ secrets.SITE_NOTIFIER_KEY }}
          owner: nanostores
          repositories: nanostores.net
          permission-actions: write
      - name: Start the site build
        env:
          GH_TOKEN: ${{ steps.token.outputs.token }}
        run: gh workflow run ci.yml --repo nanostores/nanostores.net --ref main
```

The site builds the tag of the `version` in `package.json` on the default branch, so release with a tag of the same version: `1.5.5` or `v1.5.5`.

## Check

1. After the next release of the library, for example `nanostores/router`, [its Actions](https://github.com/nanostores/router/actions) show a green **Site** run.
2. [`nanostores/nanostores.net` CI runs](https://github.com/nanostores/nanostores.net/actions/workflows/ci.yml) show a new run "Manually run by nanostores-site-notifier[bot]".
3. After it finishes, `https://nanostores.net/upstream.json` shows the new tag.

Without a release, **Run workflow** on [CI](https://github.com/nanostores/nanostores.net/actions/workflows/ci.yml) checks the build, but not the signal.
