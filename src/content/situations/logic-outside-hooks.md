---
kind: pair
label: APP LOGIC OUTSIDE REACT HOOKS
title: Don't like app logic in React hooks?
subtitle: Move it into a state manager that isn't a hook itself. Actions are plain functions, loading and derived values live next to the data — components just read.
mechanism: Actions are plain functions. Components just read.
landmarks: []
anchors: [useState, useEffect, useMemo]
boundary:
  {
    text: Like your logic in hooks?,
    strong: Zustand is a great choice.,
    home: true,
  }
toc: No app logic in React hooks
seo:
  title: Move app logic outside React hooks | Nano Stores
  description: Keep actions and derived state in plain modules while React components subscribe with one hook.
deep:
  recipe:
    - {
        step: Extract user state and its lifecycle,
        file: logic-outside-hooks/after.tsx,
      }
  limits: [hooks]
  beforeDependency: If the state belongs to one component, useState is enough.
  plugins: []
  proofs: [api]
  next: [islands, multi-framework]
---

Hooks are useful at the React boundary. Application actions are easier to reuse and test when they are plain functions in the same module as the state.
