# Frontier Realtime WebSocket

Reserved placeholder for `@shapeshift-labs/frontier-realtime-websocket`.

This repository is intentionally a placeholder. It reserves the package and source
repository name for a future WebSocket transport adapter for Frontier realtime
multiplayer. It does not contain production APIs, implementation code, benchmark
claims, or release-ready package contents yet.

Planned scope:

- WebSocket framing for realtime commands and snapshots
- browser client transport adapters
- Node server transport adapters
- reconnect and session handoff contracts for realtime rooms

This package is intended to sit above `@shapeshift-labs/frontier-realtime` and
transport realtime messages only. CRDT collaboration WebSocket transport remains
owned by `@shapeshift-labs/frontier-crdt-websocket`.

