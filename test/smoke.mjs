import assert from 'node:assert';
import { createCommandSource } from '@shapeshift-labs/frontier-realtime';
import {
  createRealtimeWebSocketClient,
  decodeRealtimeWebSocketFrame,
  encodeRealtimeWebSocketFrame,
  realtimeWebSocketFrameBytes,
  RealtimeWebSocketFrameTooLargeError
} from '../dist/index.js';
import { createRealtimeWebSocketClient as createRealtimeWebSocketClientSubpath } from '../dist/client.js';
import { encodeRealtimeWebSocketFrame as encodeRealtimeWebSocketFrameSubpath } from '../dist/wire.js';

class MemorySocket {
  readyState = 0;
  OPEN = 1;
  sent = [];
  listeners = new Map();
  send(data) {
    this.sent.push(data);
  }
  close() {
    this.readyState = 3;
    this.emit('close', {});
  }
  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }
  open() {
    this.readyState = 1;
    this.emit('open', {});
  }
  receive(data) {
    this.emit('message', { data });
  }
  emit(type, event) {
    for (const listener of this.listeners.get(type) ?? []) listener(event);
  }
}

assert.strictEqual(createRealtimeWebSocketClientSubpath, createRealtimeWebSocketClient);
assert.strictEqual(encodeRealtimeWebSocketFrameSubpath, encodeRealtimeWebSocketFrame);

{
  const join = { version: 1, type: 'join', roomId: 'room-1', clientId: 'client-a' };
  const encoded = encodeRealtimeWebSocketFrame(join);
  assert.strictEqual(typeof encoded, 'string');
  assert.deepStrictEqual(decodeRealtimeWebSocketFrame(encoded), join);
  const binary = encodeRealtimeWebSocketFrame(join, { frameEncoding: 'binary' });
  assert.ok(binary instanceof Uint8Array);
  assert.deepStrictEqual(decodeRealtimeWebSocketFrame(binary), join);
  assert.ok(realtimeWebSocketFrameBytes(encoded) > 0);
  assert.throws(() => encodeRealtimeWebSocketFrame(join, { maxFrameBytes: 4 }), RealtimeWebSocketFrameTooLargeError);
}

{
  const socket = new MemorySocket();
  const ClientWebSocket = class {
    constructor() {
      return socket;
    }
  };
  const messages = [];
  const client = createRealtimeWebSocketClient({
    url: 'ws://example.test',
    WebSocket: ClientWebSocket,
    roomId: 'room-1',
    clientId: 'client-a',
    onMessage: (message) => messages.push(message)
  });
  const source = createCommandSource({ clientId: 'client-a', now: () => 1 });
  client.command(source.create('move', { dx: 1 }, { roomId: 'room-1' }));
  assert.strictEqual(socket.sent.length, 0);

  socket.open();
  await client.ready;
  assert.strictEqual(socket.sent.length, 2);
  assert.strictEqual(decodeRealtimeWebSocketFrame(socket.sent[0]).type, 'join');
  assert.strictEqual(decodeRealtimeWebSocketFrame(socket.sent[1]).type, 'command');

  socket.receive(encodeRealtimeWebSocketFrame({ version: 1, type: 'snapshot', snapshot: { tick: 1, state: { x: 1 } } }));
  assert.strictEqual(messages[0].type, 'snapshot');

  socket.receive(encodeRealtimeWebSocketFrame({ version: 1, type: 'ping', nonce: 'n1', timeMs: 1 }));
  assert.strictEqual(decodeRealtimeWebSocketFrame(socket.sent[2]).type, 'pong');
  client.close();
  assert.strictEqual(client.closed, true);
}

console.log('frontier realtime websocket smoke passed');
