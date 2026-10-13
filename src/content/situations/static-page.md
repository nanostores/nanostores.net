---
kind: pair
label: A MOSTLY-STATIC PAGE
title: Mostly HTML. A few parts need the same state.
subtitle: Keep the page as it is. Add one plain JavaScript store — {coreSize} — for the values those parts share, instead of syncing each element by hand or turning the site into a SPA.
mechanism: One small store. No SPA, no syncing by hand.
landmarks: [server-rendered HTML, window.cart, CustomEvent]
anchors: [document.querySelectorAll, addEventListener]
boundary: { text: Just one local toggle? Plain JavaScript is enough. }
toc: Mostly HTML, a few parts share state
seo:
  title: Shared state on a mostly-static page | Nano Stores
  description: Add one small store when independent interactive parts of a static page need the same state.
deep:
  recipe:
    - {
        step: Create a store and subscribe price labels,
        file: static-page/pricing.ts,
      }
  limits: [local]
  beforeDependency: If only one element needs the value, use a local variable or a native control.
  plugins: [persistent]
  proofs: [api, size]
  next: [logic-outside-hooks, islands]
---

When a page is mostly server-rendered HTML, converting it to a single client application can be more work than the shared value requires. Put that value in a small module and import it wherever the page needs to react.
