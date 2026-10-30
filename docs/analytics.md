# Analytics

`@plausible-analytics/tracker` is bundled by Astro. The browser sends events
directly to our self-hosted Plausible at `https://lens.hplush.dev/api/event`.
No browser API key is required.

## Input

**Situation pages** (`/for/<situation>/`). Each homepage section describes one
reader's situation and links to its own page. For example, the first section
links “Actions are plain functions. Components just read.” to
`/for/logic-outside-hooks/`. On that page `situationId` is
`logic-outside-hooks` and `position` is `1`, the section's number on the
homepage (order from `src/config/order.ts`).

| Event            | Input / trigger                                                                   | Event properties                                        |
| ---------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `pageview`       | Page shown; sent by the SDK (see below)                                           | `from`; `situationId`, `position` on situation pages    |
| `engagement`     | Active time and scroll depth; sent by the SDK (see below)                         | Built-in SDK fields                                     |
| `outbound_click` | Marked link to the main GitHub repository or an external ecosystem package        | `target`, optional `package`                            |
| `install_copy`   | Successful clipboard write on a situation page                                    | `situationId`, `position`                               |
| `content_expand` | Homepage only: a section's code popover or the ecosystem objections popover opens | `situationId`, `position` when available, `contentType` |

`pageview` and `engagement` come from the Plausible SDK, not from our code:

- `pageview`: first visible page load (a background or prerendered tab waits
  until first shown), `pushState` / `popstate` with a new path, or BFCache
  restore (back / forward without reload).
- `engagement`: the SDK counts active time (tab visible and window focused) and
  maximum scroll depth. It sends them when the tab is hidden or the window
  loses focus, if scroll depth grew or at least 3 s of active time passed.

All three custom events are interactive. Internal links are measured through
pageviews; there are no custom section visibility or duration events.

Properties:

- `page`: current pathname, added to custom events and pageviews.
- `situationId`: situation ID; `position`: one-based index in `src/config/order.ts`.
- `target`: full external URL, including query and fragment. Unmarked links, same-origin URLs and non-HTTP(S) schemes produce no custom click event.
- `package`: package name, when available; omitted for built-in framework integrations.
- `from`: pageview referrer classified as `home`, `internal`, `external`, or `direct`. Acquisition referrer / UTM attribution remains SDK-managed.
- `contentType`: `code` or `objections`. Objections use `situationId=small-ecosystem`, without `position`. Initially open code produces no expansion event.

## Internal flow

```text
DOM actions → track(name, props) → adapter ─────────────────┐
SDK pageview / engagement ──────────────────────────────────┤
                                                          ↓
                  SDK fetch → https://lens.hplush.dev/api/event
```

1. `src/components/layout/Analytics.astro` loads `src/client/analytics.ts` on marketing and Starlight pages. Producers import `src/lib/analytics.ts`; ESM initializes it once, before events.
2. `pickAdapter()` selects the adapter. Only the production build (`astro build`) on `https://nanostores.net` sends to Plausible; `astro dev` logs to the `[Nano Stores]` console; preview and other hosts get a no-op. SSR does not initialize the SDK.
3. `src/lib/link-analytics.ts` delegates `click` / `auxclick` from `a[data-track="outbound_click"]` and accepts only external HTTP(S) destinations. Keyboard, modified and middle clicks produce one event; canceled / right-button activations are ignored. Homepage popovers and situation page clipboard handlers call `track()` directly.
4. `track()` adds `page`, `situationId` and `position`, marks custom events interactive, then calls `adapter.send()`. The Plausible adapter omits null / undefined properties and converts remaining values to strings.
5. The SDK adds domain, full page URL, referrer and protocol fields, then sends JSON with `fetch(..., { keepalive: true })`. SDK pageviews bypass `track()` and get their properties through `customProperties`. Automatic outbound, download and form tracking are disabled; `localStorage.plausible_ignore="true"` suppresses SDK tracking.
6. The browser POST goes cross-origin to lens. `text/plain` makes it a simple request without a CORS preflight; lens answers with `Access-Control-Allow-Origin: *`. CSP `connect-src` in `astro.config.mjs` allows `https://lens.hplush.dev`. Plausible gets the visitor IP from the connection itself, so no proxy headers are involved.

## Output

Browser: `POST https://lens.hplush.dev/api/event`, `Content-Type: text/plain`.
Example JSON body (`v` is the SDK protocol version):

```json
{
  "n": "outbound_click",
  "d": "nanostores.net",
  "u": "https://nanostores.net/",
  "r": null,
  "v": 36,
  "i": true,
  "p": { "page": "/", "target": "https://github.com/nanostores/nanostores" }
}
```

There is no proxy on our side. An earlier Nginx proxy could not reach lens:
both run on one server, and Podman's pasta network gives the website container
the server's public IP, so `lens.hplush.dev` pointed back to the container.

## Setup and verification

- In Plausible, confirm `nanostores.net` and create custom-event goals for `outbound_click`, `install_copy` and `content_expand`; filter by `target` / `package` / `situationId`. Use pageview goals for `/docs/getting-started/` and other internal destinations. Do not also install the hosted snippet or enable automatic outbound tracking.
- `install_copy` measures copying, not completed installation; outbound clicks measure a handoff, not package adoption.
- Follow the manual checks in [QA](qa.md): copy success, content expansion, single outbound click delivery and silent internal navigation. SDK engagement handles background time; custom section timers are absent. On production, verify pageviews and custom events in the dashboard; localhost / preview builds must send nothing.

Delivery check on production: in DevTools → Network, the `event` request to
`lens.hplush.dev` returns `202` and the console shows no CSP violation. Then
the visit appears in the lens realtime dashboard with the visitor's country.
HTTP 202 alone does not prove recording; `x-plausible-dropped: 1` indicates
rejection ([API reference](https://plausible.io/docs/events-api)). lens
(Plausible Community Edition) ignores `X-Debug-Request`.

Live dashboard verification and goal setup remain pending.
