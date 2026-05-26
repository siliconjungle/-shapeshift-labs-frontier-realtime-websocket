import assert from 'node:assert';
import { WebSocket } from 'ws';
import { createCommandSource } from '@shapeshift-labs/frontier-realtime';
import { createRealtimeRoom } from '../../frontier-realtime-server/dist/index.js';
import { createRealtimeWebSocketClient } from '../dist/client.js';
import { createRealtimeWebSocketServer } from '../dist/server.js';

let now = 1000;
const deltaRoom = createRealtimeRoom({
  roomId: 'arena',
  initialState: { x: 0 },
  tickRate: 20,
  now: () => now += 10,
  applyCommand: (state, command) => ({ x: state.x + command.payload.dx }),
  validateCommand: (_state, command) => Math.abs(command.payload.dx) <= 2 || 'too large'
});
const deltaServer = createRealtimeWebSocketServer({
  port: 0,
  room: deltaRoom,
  heartbeatIntervalMs: 0,
  frameEncoding: 'binary',
  createDelta(previous, next) {
    return {
      tick: next.tick,
      baseTick: previous.tick,
      timeMs: next.timeMs,
      patch: { dx: next.state.x - previous.state.x }
    };
  }
});
await deltaServer.ready;
const address = deltaServer.address();
const url = `ws://127.0.0.1:${address.port}`;
const received = [];
const client = createRealtimeWebSocketClient({
  url,
  WebSocket,
  roomId: 'arena',
  clientId: 'client-a',
  frameEncoding: 'binary',
  onMessage: (message) => received.push(message)
});
await client.ready;
await waitFor(() => received.some((message) => message.type === 'welcome'));
const welcome = received.find((message) => message.type === 'welcome');
assert.ok(welcome.sessionId);
assert.ok(welcome.resumeToken);

const source = createCommandSource({ clientId: 'client-a', now: () => now });
client.command(source.create('move', { dx: 2 }, { roomId: 'arena' }));
await waitFor(() => deltaServer.getClientIds('arena').includes('client-a'));
await waitFor(() => deltaRoom.queuedCommands === 1);
const step = deltaServer.step();
assert.strictEqual(step[0].accepted, 1);
assert.strictEqual(step[0].deltas, 1);
await waitFor(() => received.some((message) => message.type === 'command-ack'));
await waitFor(() => received.some((message) => message.type === 'delta' && message.delta.patch.dx === 2));

client.command(source.create('move', { dx: 99 }, { roomId: 'arena' }));
await waitFor(() => deltaRoom.queuedCommands === 1);
deltaServer.step();
await waitFor(() => received.some((message) => message.type === 'command-reject' && message.rejection.reason === 'too large'));

client.close();
await waitFor(() => !deltaServer.getClientIds('arena').includes('client-a'));

const resumedMessages = [];
const resumedClient = createRealtimeWebSocketClient({
  url,
  WebSocket,
  roomId: 'arena',
  clientId: 'client-a',
  sessionId: welcome.sessionId,
  resumeToken: welcome.resumeToken,
  lastSeenTick: welcome.snapshot.tick,
  frameEncoding: 'binary',
  onMessage: (message) => resumedMessages.push(message)
});
await resumedClient.ready;
await waitFor(() => resumedMessages.some((message) => message.type === 'welcome' && message.resumed === true));

resumedClient.close();
await deltaServer.close();

console.log('frontier realtime websocket integration passed');

async function waitFor(predicate, timeoutMs = 1000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  assert.fail('timed out waiting for condition');
}
