# Frontier Realtime WebSocket

WebSocket client, wire, and Node room-server transport for Frontier realtime.

This package sits above [`@shapeshift-labs/frontier-realtime`](https://www.npmjs.com/package/@shapeshift-labs/frontier-realtime). The root and `./client` entry points are browser/client safe and do not import Node's `ws` runtime. The Node WebSocket server adapter is isolated behind `@shapeshift-labs/frontier-realtime-websocket/server`.

- npm: [`@shapeshift-labs/frontier-realtime-websocket`](https://www.npmjs.com/package/@shapeshift-labs/frontier-realtime-websocket)
- source: [`siliconjungle/-shapeshift-labs-frontier-realtime-websocket`](https://github.com/siliconjungle/-shapeshift-labs-frontier-realtime-websocket)
- license: MIT

## Related Packages

The published Frontier package family is generated from one shared package catalog so READMEs stay in sync across packages:

- [`@shapeshift-labs/frontier`](https://www.npmjs.com/package/@shapeshift-labs/frontier): Core JSON diff/apply, compact patch tuples, JSON Pointer, equality, clone, validation, Unicode helpers.
- [`@shapeshift-labs/frontier-query`](https://www.npmjs.com/package/@shapeshift-labs/frontier-query): Shared query-key, selector path, condition, entity identity, and table-shape primitives.
- [`@shapeshift-labs/frontier-codec`](https://www.npmjs.com/package/@shapeshift-labs/frontier-codec): Patch serialization, binary frames, canonical JSON, and patch-history codecs.
- [`@shapeshift-labs/frontier-engine`](https://www.npmjs.com/package/@shapeshift-labs/frontier-engine): Stateful planned diff engine, adaptive profiles, schema plans, and engine-level history helpers.
- [`@shapeshift-labs/frontier-state`](https://www.npmjs.com/package/@shapeshift-labs/frontier-state): Patch-routed app-state subscriptions, owned commits, maintained views, and path mapping.
- [`@shapeshift-labs/frontier-state-cache`](https://www.npmjs.com/package/@shapeshift-labs/frontier-state-cache): Normalized query-result cache with entity/query watchers, persistence, change logs, optimistic layers, and mutation bridge.
- [`@shapeshift-labs/frontier-state-cache-idb`](https://www.npmjs.com/package/@shapeshift-labs/frontier-state-cache-idb): IndexedDB persistence adapter for Frontier state-cache snapshots.
- [`@shapeshift-labs/frontier-state-cache-file`](https://www.npmjs.com/package/@shapeshift-labs/frontier-state-cache-file): Structured file persistence adapter for Frontier state-cache snapshots and change logs.
- [`@shapeshift-labs/frontier-state-cache-sql`](https://www.npmjs.com/package/@shapeshift-labs/frontier-state-cache-sql): SQL persistence adapter for Frontier state-cache snapshots and change logs.
- [`@shapeshift-labs/frontier-schema`](https://www.npmjs.com/package/@shapeshift-labs/frontier-schema): JSON Schema validation, Frontier profile generation, CloudEvent envelopes, and query/table schema helpers.
- [`@shapeshift-labs/frontier-event-log`](https://www.npmjs.com/package/@shapeshift-labs/frontier-event-log): Bounded event logs, replay cursors, consumer acknowledgements, keyed compaction, checkpoints, and Frontier patch event records.
- [`@shapeshift-labs/frontier-scheduler`](https://www.npmjs.com/package/@shapeshift-labs/frontier-scheduler): Deterministic work scheduling, lanes, cancellation, backpressure, frame policies, replay snapshots, and work graphs.
- [`@shapeshift-labs/frontier-logging`](https://www.npmjs.com/package/@shapeshift-labs/frontier-logging): Opt-in structured logging, browser telemetry, file sinks, exporters, benchmark traces, and Frontier patch/update summaries.
- [`@shapeshift-labs/frontier-mutation`](https://www.npmjs.com/package/@shapeshift-labs/frontier-mutation): Explicit mutation and selector plans compiled to Frontier patches or CRDT operations.
- [`@shapeshift-labs/frontier-virtual`](https://www.npmjs.com/package/@shapeshift-labs/frontier-virtual): DOM-neutral virtualization, layout providers, range materialization, grids, spatial culling, frustum culling, and serializable layout state.
- [`@shapeshift-labs/frontier-dom`](https://www.npmjs.com/package/@shapeshift-labs/frontier-dom): Patch-native DOM and host renderer bindings, manifest hydration, JSX runtime/compiler helpers, SSR, devtools, and logging bridges.
- [`@shapeshift-labs/frontier-crdt`](https://www.npmjs.com/package/@shapeshift-labs/frontier-crdt): Native CRDT documents, update tooling, awareness, branches, conflict introspection, version frames, and undo.
- [`@shapeshift-labs/frontier-crdt-sync`](https://www.npmjs.com/package/@shapeshift-labs/frontier-crdt-sync): CRDT sync endpoints, repo/storage/provider contracts, document URLs, local networks, model checking, forensics, and text binding contracts.
- [`@shapeshift-labs/frontier-crdt-websocket`](https://www.npmjs.com/package/@shapeshift-labs/frontier-crdt-websocket): WebSocket client/server transports for Frontier CRDT sync providers.
- [`@shapeshift-labs/frontier-react`](https://www.npmjs.com/package/@shapeshift-labs/frontier-react): React external-store hooks and adapters for Frontier state, cache, and CRDT surfaces.
- [`@shapeshift-labs/frontier-richtext`](https://www.npmjs.com/package/@shapeshift-labs/frontier-richtext): Rich text Delta normalization/application, marks, embeds, ranges, and cursor/selection transforms for local editor integrations.
- [`@shapeshift-labs/frontier-realtime`](https://www.npmjs.com/package/@shapeshift-labs/frontier-realtime): Shared realtime command, tick, snapshot, prediction, reconciliation, interpolation, rollback, message, and delta primitives.
- [`@shapeshift-labs/frontier-realtime-server`](https://www.npmjs.com/package/@shapeshift-labs/frontier-realtime-server): Authoritative realtime room, tick, command validation, rate-limit, session, and snapshot-history runtime.
- [`@shapeshift-labs/frontier-game`](https://www.npmjs.com/package/@shapeshift-labs/frontier-game): Game-facing entity, component, player, room, ownership, spatial interest, rollback, physics, and replication helpers above realtime.

Package source repositories:

- [`siliconjungle/-shapeshift-labs-frontier`](https://github.com/siliconjungle/-shapeshift-labs-frontier)
- [`siliconjungle/-shapeshift-labs-frontier-query`](https://github.com/siliconjungle/-shapeshift-labs-frontier-query)
- [`siliconjungle/-shapeshift-labs-frontier-codec`](https://github.com/siliconjungle/-shapeshift-labs-frontier-codec)
- [`siliconjungle/-shapeshift-labs-frontier-engine`](https://github.com/siliconjungle/-shapeshift-labs-frontier-engine)
- [`siliconjungle/-shapeshift-labs-frontier-state`](https://github.com/siliconjungle/-shapeshift-labs-frontier-state)
- [`siliconjungle/-shapeshift-labs-frontier-state-cache`](https://github.com/siliconjungle/-shapeshift-labs-frontier-state-cache)
- [`siliconjungle/-shapeshift-labs-frontier-state-cache-idb`](https://github.com/siliconjungle/-shapeshift-labs-frontier-state-cache-idb)
- [`siliconjungle/-shapeshift-labs-frontier-state-cache-file`](https://github.com/siliconjungle/-shapeshift-labs-frontier-state-cache-file)
- [`siliconjungle/-shapeshift-labs-frontier-state-cache-sql`](https://github.com/siliconjungle/-shapeshift-labs-frontier-state-cache-sql)
- [`siliconjungle/-shapeshift-labs-frontier-schema`](https://github.com/siliconjungle/-shapeshift-labs-frontier-schema)
- [`siliconjungle/-shapeshift-labs-frontier-event-log`](https://github.com/siliconjungle/-shapeshift-labs-frontier-event-log)
- [`siliconjungle/-shapeshift-labs-frontier-scheduler`](https://github.com/siliconjungle/-shapeshift-labs-frontier-scheduler)
- [`siliconjungle/-shapeshift-labs-frontier-logging`](https://github.com/siliconjungle/-shapeshift-labs-frontier-logging)
- [`siliconjungle/-shapeshift-labs-frontier-mutation`](https://github.com/siliconjungle/-shapeshift-labs-frontier-mutation)
- [`siliconjungle/-shapeshift-labs-frontier-virtual`](https://github.com/siliconjungle/-shapeshift-labs-frontier-virtual)
- [`siliconjungle/-shapeshift-labs-frontier-dom`](https://github.com/siliconjungle/-shapeshift-labs-frontier-dom)
- [`siliconjungle/-shapeshift-labs-frontier-crdt`](https://github.com/siliconjungle/-shapeshift-labs-frontier-crdt)
- [`siliconjungle/-shapeshift-labs-frontier-crdt-sync`](https://github.com/siliconjungle/-shapeshift-labs-frontier-crdt-sync)
- [`siliconjungle/-shapeshift-labs-frontier-crdt-websocket`](https://github.com/siliconjungle/-shapeshift-labs-frontier-crdt-websocket)
- [`siliconjungle/-shapeshift-labs-frontier-react`](https://github.com/siliconjungle/-shapeshift-labs-frontier-react)
- [`siliconjungle/-shapeshift-labs-frontier-richtext`](https://github.com/siliconjungle/-shapeshift-labs-frontier-richtext)
- [`siliconjungle/-shapeshift-labs-frontier-realtime`](https://github.com/siliconjungle/-shapeshift-labs-frontier-realtime)
- [`siliconjungle/-shapeshift-labs-frontier-realtime-server`](https://github.com/siliconjungle/-shapeshift-labs-frontier-realtime-server)
- [`siliconjungle/-shapeshift-labs-frontier-realtime-websocket`](https://github.com/siliconjungle/-shapeshift-labs-frontier-realtime-websocket)
- [`siliconjungle/-shapeshift-labs-frontier-game`](https://github.com/siliconjungle/-shapeshift-labs-frontier-game)

## Install

```sh
npm install @shapeshift-labs/frontier-realtime @shapeshift-labs/frontier-realtime-websocket
```

Install `@shapeshift-labs/frontier-realtime-server` when using the Node room server adapter.

## Client Usage

```ts
import { createCommandSource } from '@shapeshift-labs/frontier-realtime';
import { createRealtimeWebSocketClient } from '@shapeshift-labs/frontier-realtime-websocket';

const commands = createCommandSource({ clientId: 'player-a' });

const client = createRealtimeWebSocketClient({
  url: 'wss://example.com/realtime',
  roomId: 'arena-1',
  clientId: 'player-a',
  frameEncoding: 'binary',
  onMessage(message) {
    if (message.type === 'snapshot') {
      console.log(message.snapshot);
    }
  }
});

await client.ready;
client.command(commands.create('move', { dx: 1 }, { roomId: 'arena-1' }));
```

## Server Usage

```ts
import { createRealtimeRoom } from '@shapeshift-labs/frontier-realtime-server';
import { createRealtimeWebSocketServer } from '@shapeshift-labs/frontier-realtime-websocket/server';

const room = createRealtimeRoom({
  roomId: 'arena-1',
  initialState: { x: 0 },
  applyCommand(state, command) {
    return command.type === 'move'
      ? { x: state.x + command.payload.dx }
      : state;
  }
});

const server = createRealtimeWebSocketServer({ port: 8080, room });

setInterval(() => {
  server.step();
}, 50);
```

## API

```ts
import {
  createRealtimeWebSocketClient,
  decodeRealtimeWebSocketFrame,
  encodeRealtimeWebSocketFrame
} from '@shapeshift-labs/frontier-realtime-websocket';

import {
  createRealtimeWebSocketServer
} from '@shapeshift-labs/frontier-realtime-websocket/server';
```

### Wire Frames

`encodeRealtimeWebSocketFrame(message, options)` and `decodeRealtimeWebSocketFrame(data, options)` encode and decode Frontier realtime client/server message envelopes. The default transport frame is JSON text; `frameEncoding: "binary"` uses the compact binary protocol from `@shapeshift-labs/frontier-realtime/binary`.

### Client

`createRealtimeWebSocketClient(options)` wraps a browser-compatible `WebSocket` constructor. It can auto-join a room, queue messages until open, send commands, resume sessions by passing `sessionId`/`resumeToken`, reply to server pings with pongs, and deliver decoded server messages to subscribers.

### Server

`createRealtimeWebSocketServer(options)` uses Node `ws` and stays behind `./server`. It accepts joins, authenticates optional join contexts, binds sockets to structural realtime rooms, queues commands through `room.enqueue()`, and broadcasts per-client snapshots or optional deltas plus ack/reject messages when `server.step()` is called.

## Subpath Imports

```ts
import { createRealtimeWebSocketClient } from '@shapeshift-labs/frontier-realtime-websocket/client';
import { createRealtimeWebSocketServer } from '@shapeshift-labs/frontier-realtime-websocket/server';
import { encodeRealtimeWebSocketFrame } from '@shapeshift-labs/frontier-realtime-websocket/wire';
```

## Package Scope

This package intentionally owns only WebSocket transport:

- Client-safe WebSocket adapter.
- JSON/binary wire frame helpers for Frontier realtime messages.
- Node `ws` server adapter for structural realtime rooms.
- Reconnect/resume join metadata.
- Optional per-client delta transport through a caller-provided `createDelta()` function.
- Join, command, leave, ping, pong, snapshot, ack, and rejection transport.

It does not own authoritative simulation, game entities, prediction/reconciliation, persistence, CRDT sync, rendering, physics, or anti-cheat policy. Those belong in lower/higher Frontier packages or application code.

## TypeScript

The package ships ESM JavaScript plus `.d.ts` declarations for the root export and public subpaths. The Node server adapter imports `ws` only from `./server`.

## Validation

```sh
npm test
npm run integration
npm run fuzz
npm run bench
npm run pack:dry
```

The package test suite covers root/client/wire/server imports, browser-safe root boundaries, frame encode/decode, oversized-frame rejection, client send/receive behavior, real WebSocket integration with a Frontier realtime room, fuzzed message round trips, TypeScript declarations, and package export boundaries.

## Benchmarks

Run the package-local benchmark:

```sh
npm run bench
```

Latest local package benchmark on Node v26.1.0, darwin arm64, 9 rounds:

| Fixture | Median | p95 |
| --- | ---: | ---: |
| Encode/decode 128 JSON frames | 93.74 us | 96.59 us |
| Encode/decode 128 binary frames | 93.69 us | 96.86 us |
| Client queue/send 128 commands | 63.76 us | 66.49 us |
| WebSocket server step, 1 room | 0.44 us | 0.49 us |

These are Frontier-only package measurements, not competitor comparisons.

## License

MIT. See [LICENSE](./LICENSE).
