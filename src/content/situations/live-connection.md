---
kind: situation
label: SHARED LIVE DATA
title: Three components, one live connection.
subtitle: If each useEffect opens a socket, connections and cleanup multiply. One store opens the connection for the first subscriber and closes it after the last.
mechanism: The first subscriber opens it. The last one closes it.
landmarks: [useEffect cleanup]
anchors: [WebSocket, onmessage, close()]
boundary: { text: Already have one shared connection? You don't need this. }
toc: One live connection, many components
seo:
  title: Share one live connection | Nano Stores
  description: Open one connection when the first subscriber arrives and clean it up after the last.
deep:
  recipe:
    - {
        step: Attach a connection to the store lifecycle,
        file: live-connection/prices.ts,
      }
  limits: [connection]
  beforeDependency: Reuse your existing shared connection if it already has sound cleanup.
  plugins: []
  proofs: [api]
  next: [islands, multi-framework]
---

The store lifecycle gives the connection one owner. Subscribers receive the latest value without opening separate sockets.
