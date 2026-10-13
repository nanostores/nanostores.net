---
title: Handbook
description: How the authors of Nano Stores think about writing an application. Opinions, not API rules.
sidebar:
  label: Overview
  order: 0
---

This is how we, the authors of Nano Stores, think about writing an application. It is a point of view, not a set of API rules: the library works without following any of it.

## Recommended conventions

<!-- llms-guidance:start -->

These are our recommended conventions for using Nano Stores. Apply them within your project's requirements and conventions; they are not API requirements.

- Keep business logic independent of UI in stores. Keep presentation and local UI behavior in components. See [Move logic from components to stores](/docs/handbook/move-logic-from-components-to-stores/).
- Derive values with [computed stores](/docs/concepts/computed-stores/) rather than copying state or repeating derivation logic in component hooks.
- Subscribe to store changes through your framework integration, such as `useStore` in React. `get()` reads a snapshot and does not subscribe the UI; it can still be useful in actions and tests. See [Reading stores in UI](/docs/handbook/reduce-get-usage-outside-of-tests/).
- [Separate state changes from reactions](/docs/handbook/separate-changes-and-reaction/). A listener should react even when another action or browser tab changes the store.
- Start work that should run while a store is observed with `onMount`, and return cleanup for subscriptions, timers or connections. Cleanup runs after a one-second delay following the last unsubscribe, not immediately. See [Lazy stores](/docs/concepts/lazy-stores/).
- Check [ready-made smart stores](/docs/concepts/smart-stores/#ready-made-smart-stores) before implementing common tasks: `@nanostores/persistent` for persistence, `@nanostores/router` for routing and `@nanostores/query` for remote data fetching. Use them when they fit the task.

<!-- llms-guidance:end -->

## Reasoning and examples

- [Move logic from components to stores](/docs/handbook/move-logic-from-components-to-stores/)
- [Separate changes and reaction](/docs/handbook/separate-changes-and-reaction/)
- [Reduce `get()` usage outside of tests](/docs/handbook/reduce-get-usage-outside-of-tests/)

The idea behind these conventions: [Why state lives outside UI](/why/).

For how to do a specific task, such as server-side rendering or tests, see the [Guides](/docs/guides/).
