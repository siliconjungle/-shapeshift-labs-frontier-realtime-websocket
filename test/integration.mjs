import assert from 'node:assert';
import { WebSocket } from 'ws';
import { createCommandSource } from '@shapeshift-labs/frontier-realtime';
import { createRealtimeRoom } from '../../frontier-realtime-server/dist/index.js';
import { createRealtimeWebSocketClient } from '../dist/client.js';
import { createRealtimeWebSocketServer } from '../dist/server.js';

let now = 1000;
const room = createRealtimeRoom({
  roomId: 'arena',
  initialState: { x: 0 },
  tickRate: 20,
  now: () => now += 10,
  applyCommand: (state, command) => ({ x: state.x + command.payload.dx }),
  validateCommand: (_state, command) => Math.abs(command.payload.dx) <= 2 || 'too large'
});
const server = createRealtimeWebSocketServer({ port: 0, room, heartbeatIntervalMs: 0 });
await server.ready;
const address = server.address();
const url = `ws://127.0.0.1:${address.port}`;
const received = [];
const client = createRealtimeWebSocketClient({
  url,
  WebSocket,
  roomId: 'arena',
  clientId: 'client-a',
  onMessage: (message) => received.push(message)
});
await client.ready;
await waitFor(() => received.some((message) => message.type === 'welcome'));

const source = createCommandSource({ clientId: 'client-a', now: () => now });
client.command(source.create('move', { dx: 2 }, { roomId: 'arena' }));
await waitFor(() => server.getClientIds('arena').includes('client-a'));
await waitFor(() => room.queuedCommands === 1);
const step = server.step();
assert.strictEqual(step[0].accepted, 1);
await waitFor(() => received.some((message) => message.type === 'command-ack'));
await waitFor(() => received.some((message) => message.type === 'snapshot' && message.snapshot.state.x === 2));

client.command(source.create('move', { dx: 99 }, { roomId: 'arena' }));
await waitFor(() => room.queuedCommands === 1);
server.step();
await waitFor(() => received.some((message) => message.type === 'command-reject' && message.rejection.reason === 'too large'));

client.close();
await server.close();

console.log('frontier realtime websocket integration passed');

async function waitFor(predicate, timeoutMs = 1000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  assert.fail('timed out waiting for condition');
}
