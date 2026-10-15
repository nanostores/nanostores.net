# Analytics

The official `@plausible-analytics/tracker` npm module is bundled by Astro and
served with the site. There is no external tracker script, Astro analytics
plugin, tag manager or additional collector service.

The shared `Analytics.astro` component loads the client entry on marketing and
Starlight pages. Every event producer imports `src/lib/analytics.ts`, so ESM
initializes the tracker once before immediate events, regardless of script order.
Only production builds on the exact origin `https://nanostores.net` send events.
Development logs `[Nano Stores]` events; production previews and other origins
use a no-op adapter. No secret or API key is embedded in the browser.

## Delivery

```text
bundled browser JS → POST /api/event → nginx → https://plausible.io/api/event
```

Nginx accepts POST only on the exact path, verifies the upstream certificate,
preserves User-Agent and forwards the visitor's IP. Cookies and Authorization
are not forwarded. Connect, send and read timeouts are bounded; requests are
not retried. The tracker uses fetch with keepalive so navigation does not have
to wait for analytics delivery.

The current [hplush/cloud container template](https://github.com/hplush/cloud/blob/main/roles/web/templates/web.container.j2)
binds published ports to host loopback. Caddy is the trusted ingress and
[replaces untrusted forwarding headers](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy#defaults).
Nginx preserves that sanitized X-Forwarded-For chain, then appends its peer.
Do not expose port 8000 directly to public clients or trust arbitrary incoming
forwarding headers when moving this image to another host. Recheck the ingress
configuration and the diagnostic below after a hosting change.

The fixed upstream hostname uses the container's system resolver when Nginx
starts. No additional public DNS service is configured. DNS must work at startup;
restart or reload Nginx if Plausible changes its upstream addresses.

## Events and properties

| Event            | Trigger                                                                                      | Properties beyond `page`                                 | Interactive       |
| ---------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ----------------- |
| `pageview`       | Initial visible page, navigation or BFCache restore, managed by Plausible                    | `from`; `situationId` and `position` on `/for/*`         | Standard pageview |
| `section_view`   | A homepage situation is dominant and visible continuously for 1 second; once per document    | `situationId`, `position`                                | No                |
| `section_dwell`  | A qualifying situation loses dominance, the tab becomes hidden, or the document is suspended | `situationId`, `position`, `ms`                          | No                |
| `content_expand` | A code or objections popover opens; each opening                                             | `situationId`, `position` where available, `contentType` | Yes               |
| `cta_click`      | An explicitly marked navigation or next-step link is activated                               | `placement`, `target`; situation context where available | Yes               |
| `install_copy`   | Clipboard write succeeds on `/for/*`                                                         | `situationId`, `position`                                | Yes               |
| `package_click`  | A package or alternative link on Ecosystem is activated                                      | `placement`, `target`, `package`                         | Yes               |

Custom properties are strings; absent values are omitted. `page` is the current
pathname, and `position` is the one-based homepage order from `src/config/order.ts`.
Internal `target` values are paths with query and fragment; external targets are
full URLs. `from` describes the document referrer: `home`, `internal`, `external`
or `direct` (no referrer available). It does not prove the visitor's original
acquisition source; Plausible handles referrers and UTM attribution separately.

`placement` values:

- `header`: shared Docs, API, Ecosystem and GitHub navigation, including mobile.
- `situation`: homepage links to `/for/*`.
- `philosophy`, `home-start`: homepage Why and Getting started links.
- `objections`: links inside the homepage ecosystem answers.
- `situation-start`, `situation-next`: Getting started and related links on `/for/*`.
- `ecosystem-package`, `ecosystem-alternative`: package name links.
- `ecosystem-start`, `ecosystem-next`, `ecosystem-situation`: Ecosystem next steps.
- `why-reference`, `why-next`: essay references and return to situations.

`contentType` is `code` or `objections`. The objections block uses
`situationId=small-ecosystem` and has no numeric position. The first homepage
example is already open and does not generate an expansion event. Native
keyboard activation, ordinary clicks, modified clicks and middle clicks share
one delegated handler; canceled and right-button activations are ignored.

For short sections, at least half the section must be visible; for sections
taller than the viewport, at least half the viewport. The qualifying section
with the most visible pixels wins. A quick scroll produces neither a view nor
dwell. Dwell includes the first qualifying second and is sent in separate visible
intervals; background time is excluded. A revisit can add dwell but never another
section view in the same document. BFCache restores keep that seen set and start
a fresh interval. Geometry is a visibility signal, not proof of reading.

## Plausible setup

Add or confirm `nanostores.net` in Plausible. Create custom event goals for
`cta_click`, `install_copy`, `package_click` and `content_expand`. Use target and
placement filters to distinguish Getting started, GitHub and other destinations.
Add `section_view` and `section_dwell` goals if section analysis is needed; both
are non-interactive and do not turn a pageview into an interaction by themselves.
Do not also install the hosted snippet or enable automatic outbound click
tracking: marked external CTAs are already sent by the shared handler.

`deep_view`, `code_expand`, `section_cta_click`, `deep_cta_click`, `exit_click` and
the unused `toc_click` have been replaced. This checkout previously used the
production no-op adapter; there is no historical production event stream to migrate.
`install_copy` is a successful copy, not evidence that npm installation completed.

Plausible does not automatically average the custom `ms` property. Use exports
or a suitable report for dwell analysis; it is separate from Plausible's built-in
page engagement metrics.

## Verification

Run the normal format, build, type and dependency checks from [QA](qa.md).
The focused unit suites are `src/lib/analytics.test.ts` and
`src/lib/section-analytics.test.ts`. They cover origin gating, SSR safety, init
ordering, property conversion, passive events, viewport geometry, continuous
visibility, pauses, duplicate flushes and delayed timers.

In development, inspect `[Nano Stores]` console events:

1. On `/`, pause on a situation for a second, scroll away, return, then quickly
   scroll past another situation. Check views, dwell and one-based positions.
2. Switch tabs and return; go to a different page and back. Hidden time must not
   appear in dwell. Returning must not duplicate section views in a restored document.
3. Open and close a code popover and the ecosystem answers. Check `contentType`.
4. Follow a CTA normally, with Enter, with a modifier and with the middle button.
   Each activation should produce one event; right clicks should produce none.
5. On `/for/islands/`, copy the command and follow Getting started. Check one
   `install_copy` only after the success state, then one `cta_click`.
6. Check header actions on docs, package links and next steps on Ecosystem, and
   reference links on Why. Check `page`, `target` and `placement` in DevTools.

For the production build, localhost and preview origins must make no analytics
requests. On the real origin, verify one initial pageview, the `/api/event`
endpoint, custom properties, passive events and arrivals in the Plausible dashboard.
There should be no script downloaded from Plausible and no direct browser request
to its endpoint. Other pre-existing third-party resources, such as Google Fonts,
are outside this analytics change.

To diagnose the deployed proxy without recording an event:

```sh
curl --silent --show-error --include \
  https://nanostores.net/api/event \
  -H 'Content-Type: text/plain' \
  -H 'X-Debug-Request: true' \
  --data '{"name":"pageview","url":"https://example.invalid/","domain":"example.invalid"}'
```

Expect HTTP 200 and the requesting visitor's public IP. A normal ingestion
response of HTTP 202 alone does not establish that an event was recorded:
`x-plausible-dropped: 1` indicates rejection. See the
[Plausible Events API](https://plausible.io/docs/events-api).

TLS inspection software can replace Plausible's certificate locally. In that
case an otherwise correct container proxy can reject it. Use a test-only trust
bundle matching the local environment when diagnosing this; do not disable
upstream TLS verification or add a workstation's antivirus root to the production image.

## Implementation verification (2026-10-15)

- Formatting passed. The production build and output checks passed for all 46
  pages and the three documentation exports. A separate output inspection found
  exactly one shared analytics entry on every built HTML page.
- Astro diagnostics: zero errors, zero warnings, two pre-existing Zod deprecation
  hints. The unit suite passed 87 tests; executable snippet types passed, and the
  snippet behavior suite passed eight tests.
- Codex in-app Chromium at 1280×720 and 390×844: checked homepage code and
  objections popovers, ordinary and middle-button CTA activation, mobile header
  navigation, successful copy on `/for/islands/`, Getting started, the shared
  docs header, a package link from Ecosystem, and an essay reference activated
  with Enter. Console events appeared once for the checked activations. Also
  opened Getting started from the local production container without browser
  console errors. This was interaction QA, not a full visual regression pass.
- The actual read-only Nginx image served the home, situation, Ecosystem, Why,
  Getting started and API routes. GET `/api/event` returned 405; `/api/event/`
  and a missing page returned 404. The diagnostic POST returned HTTP 200 and
  the supplied test IP `203.0.113.42`. This workstation's Avast TLS inspection
  required its already trusted public root in a test-only mounted CA bundle;
  that certificate is not part of the source or production image.
- Hidden-time, delayed-timer and restore interval semantics were checked in
  unit tests; a timed background-tab/BFCache browser experiment was not completed.
  Production-domain pageviews, dashboard arrivals and goal setup remain deployment
  checks and were not performed against the live site.
