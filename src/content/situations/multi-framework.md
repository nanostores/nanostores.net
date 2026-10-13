---
kind: situation
label: ONE STATE, SEVERAL FRAMEWORKS
title: One state for React, Vue and Svelte users.
subtitle: Keep it in a plain JS store. Each framework reads it through its own adapter.
mechanism: A plain JS store, one adapter per framework.
secondLine: 'Same for apps: React logic that is now needed in Vue or a plain JavaScript SDK.'
landmarks: []
anchors: [React, Vue, Svelte, vanilla JS (querySelector)]
boundary:
  { text: 'One framework, now and later? Its own state tools may be enough.' }
toc: One state for several frameworks
seo:
  title: One reactive state across frameworks | Nano Stores
  description: Put state in a plain JavaScript module and use small framework adapters at the edge.
deep:
  recipe:
    - {
        step: Export a framework-independent session store,
        file: multi-framework/session.ts,
      }
  limits: [framework]
  beforeDependency: If the library only serves one framework, its native state model may be simpler.
  plugins: []
  proofs: [api]
  next: [outgrowing-context, islands]
---

A library can expose one stateful core without deciding how every consumer renders it. Each framework can subscribe through its own adapter.
