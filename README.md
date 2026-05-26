# Frontier Realtime WebSocket

WebSocket client, wire, and Node room-server transport for Frontier realtime.

This package sits above [`@shapeshift-labs/frontier-realtime`](https://www.npmjs.com/package/@shapeshift-labs/frontier-realtime). The root and `./client` entry points are browser/client safe and do not import Node's `ws` runtime. The Node WebSocket server adapter is isolated behind `@shapeshift-labs/frontier-realtime-websocket/server`.

- npm: [`@shapeshift-labs/frontier-realtime-websocket`](https://www.npmjs.com/package/@shapeshift-labs/frontier-realtime-websocket)
- source: [`siliconjungle/-shapeshift-labs-frontier-realtime-websocket`](https://github.com/siliconjungle/-shapeshift-labs-frontier-realtime-websocket)
- license: MIT

## Related Packages

- [`@shapeshift-labs/frontier-realtime`](https://www.npmjs.com/package/@shapeshift-labs/frontier-realtime): shared command, tick, snapshot, prediction, reconciliation, interpolation, and message contracts used by this package.
- [`@shapeshift-labs/frontier-realtime-server`](https://www.npmjs.com/package/@shapeshift-labs/frontier-realtime-server): authoritative room runtime that can be hosted by the Node server adapter through structural room interfaces.
- [`@shapeshift-labs/frontier`](https://www.npmjs.com/package/@shapeshift-labs/frontier): core JSON diff/apply primitives for application state and snapshot patches.
- [`@shapeshift-labs/frontier-logging`](https://www.npmjs.com/package/@shapeshift-labs/frontier-logging): optional diagnostics for room ticks, network latency, and rejected commands.

Companion repository:

- [`@shapeshift-labs/frontier-game`](https://github.com/siliconjungle/-shapeshift-labs-frontier-game): game-facing entity, component, player, room, ownership, spatial interest, and replication vocabulary above realtime.

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
