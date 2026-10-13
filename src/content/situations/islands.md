---
kind: situation
label: SEPARATE ISLANDS OR ROOTS
title: The second Astro island needs the same cart.
subtitle: Context reaches only components inside its provider, and islands have separate roots. Both islands import one store and show the current cart.
mechanism: Context stops at its root. A store doesn't.
landmarks: [Astro islands, multiple React roots, microfrontends]
anchors: [React, Vue]
boundary: { text: Separate bundles must share one copy of the store module. }
toc: Two islands need the same data
seo:
  title: Share state between islands and roots | Nano Stores
  description: Two independent islands can import one store module to see the same cart.
deep:
  recipe:
    - {
        step: Export one cart store from a shared module,
        file: islands/cart.ts,
      }
  limits: []
  beforeDependency: If the islands never share data, keep their state isolated.
  plugins: []
  proofs: [api]
  next: [outgrowing-context, multi-framework]
---

Each island owns its component tree. Import the same store module from both entry points and make sure the bundler does not duplicate that module.
