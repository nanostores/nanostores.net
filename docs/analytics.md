# Analytics

`@plausible-analytics/tracker` is bundled by Astro. Browser requests use
`/api/event`; Nginx forwards them to Plausible. No browser API key is required.

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
                        SDK fetch → /api/event → Nginx → Plausible
```

1. `src/components/layout/Analytics.astro` loads `src/client/analytics.ts` on marketing and Starlight pages. Producers import `src/lib/analytics.ts`; ESM initializes it once, before events.
2. `pickAdapter()` selects the adapter. Only the production build (`astro build`) on `https://nanostores.net` sends to Plausible; `astro dev` logs to the `[Nano Stores]` console; preview and other hosts get a no-op. SSR does not initialize the SDK.
3. `src/lib/link-analytics.ts` delegates `click` / `auxclick` from `a[data-track="outbound_click"]` and accepts only external HTTP(S) destinations. Keyboard, modified and middle clicks produce one event; canceled / right-button activations are ignored. Homepage popovers and situation page clipboard handlers call `track()` directly.
4. `track()` adds `page`, `situationId` and `position`, marks custom events interactive, then calls `adapter.send()`. The Plausible adapter omits null / undefined properties and converts remaining values to strings.
5. The SDK adds domain, full page URL, referrer and protocol fields, then sends JSON with `fetch(..., { keepalive: true })`. SDK pageviews bypass `track()` and get their properties through `customProperties`. Automatic outbound, download and form tracking are disabled; `localStorage.plausible_ignore="true"` suppresses SDK tracking.
6. The browser POST reaches Caddy, then Nginx. Nginx forwards body and User-Agent, preserves Caddy's sanitized X-Forwarded-For chain and appends its peer, strips Cookie / Authorization, and sends HTTPS to Plausible.

## Output

Browser: `POST https://nanostores.net/api/event`, `Content-Type: text/plain`.
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

Nginx forwards to `https://plausible.io/api/event`: exact POST route, 16 KiB body
limit, SNI + certificate verification, connect / send / read timeouts of 3 / 5 / 5
seconds, no retries. Other methods return 405. Upstream DNS uses the container's
system resolver at startup; reload / restart Nginx after upstream address changes.

Trust boundary: [hplush/cloud](https://github.com/hplush/cloud/blob/main/roles/web/templates/web.container.j2)
binds container ports to host loopback; [Caddy sanitizes forwarding headers](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy#defaults).
Keep port 8000 private; revalidate visitor IP forwarding after hosting changes.

## Setup and verification

- In Plausible, confirm `nanostores.net` and create custom-event goals for `outbound_click`, `install_copy` and `content_expand`; filter by `target` / `package` / `situationId`. Use pageview goals for `/docs/getting-started/` and other internal destinations. Do not also install the hosted snippet or enable automatic outbound tracking.
- `install_copy` measures copying, not completed installation; outbound clicks measure a handoff, not package adoption.
- Follow the manual checks in [QA](qa.md): copy success, content expansion, single outbound click delivery and silent internal navigation. SDK engagement handles background time; custom section timers are absent. On production, verify pageviews and custom events in the dashboard; localhost / preview builds must send nothing.

Proxy diagnostic, without recording an event:

```sh
curl --silent --show-error --include \
  https://nanostores.net/api/event \
  -H 'Content-Type: text/plain' \
  -H 'X-Debug-Request: true' \
  --data '{"name":"pageview","url":"https://example.invalid/","domain":"example.invalid"}'
```

Expected: HTTP 200 + visitor public IP. Normal HTTP 202 alone does not prove
recording; `x-plausible-dropped: 1` indicates rejection ([API reference](https://plausible.io/docs/events-api)).
For local TLS inspection, use a test-only trust bundle; retain production TLS verification.

Live dashboard verification and goal setup remain pending.
