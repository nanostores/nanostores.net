---
kind: situation
label: CONTEXT IS GETTING EXPENSIVE
title: React Context keeps growing. Redux is on the table.
subtitle: Context still works — but every provider and update path costs more to maintain. Compare a small store with both options first.
mechanism: Context passes values down. It doesn't manage them.
secondLine: Earlier on? A small React app outgrowing Context — and Redux feels like overkill.
landmarks: [useContext, useReducer, do I need Redux?]
anchors: ['<CartProvider>', '<UserProvider>']
boundary: { text: Rarely-changing values? Context is still the right tool. }
toc: React Context keeps growing
seo:
  title: React Context, Redux or a small store? | Nano Stores
  description: Compare a small store with Context and Redux when provider wiring starts to grow.
deep:
  recipe:
    - {
        step: Move shared cart state into a module,
        file: outgrowing-context/store.tsx,
      }
  limits: [context]
  beforeDependency: Keep Context for stable values such as theme and locale.
  plugins: []
  proofs: [api]
  next: [logic-outside-hooks, islands]
---

Context is still a good default for values that rarely change. A small store helps when independently updated shared values make the provider tree cumbersome.
