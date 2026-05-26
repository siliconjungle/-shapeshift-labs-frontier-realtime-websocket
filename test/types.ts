import { createCommandSource, type RealtimeServerMessage } from '@shapeshift-labs/frontier-realtime';
import {
  createRealtimeWebSocketClient,
  decodeRealtimeWebSocketFrame,
  encodeRealtimeWebSocketFrame
} from '../dist/index.js';
import { createRealtimeWebSocketClient as createRealtimeWebSocketClientSubpath } from '../dist/client.js';
import { createRealtimeWebSocketServer } from '../dist/server.js';
import { encodeRealtimeWebSocketFrame as encodeRealtimeWebSocketFrameSubpath } from '../dist/wire.js';

const source = createCommandSource({ clientId: 'client-a' });
const frame = encodeRealtimeWebSocketFrame({ version: 1, type: 'join', roomId: 'room-1', clientId: 'client-a' });
decodeRealtimeWebSocketFrame(frame);
encodeRealtimeWebSocketFrameSubpath({ version: 1, type: 'leave', roomId: 'room-1' });

class TestSocket {
  readyState = 1;
  OPEN = 1;
  send(_data: string | Uint8Array): void {}
  close(_code?: number, _reason?: string): void {}
  addEventListener(_type: 'open' | 'message' | 'close' | 'error', _listener: (...args: unknown[]) => void): void {}
}

class TestWebSocket extends TestSocket {
  constructor(_url: string, _protocols?: string | string[]) {
    super();
  }
}

const client = createRealtimeWebSocketClient<RealtimeServerMessage>({
  url: 'ws://example.test',
  WebSocket: TestWebSocket,
  roomId: 'room-1',
  clientId: 'client-a'
});
createRealtimeWebSocketClientSubpath({ url: 'ws://example.test', WebSocket: TestWebSocket });
client.command(source.create('move', { dx: 1 }));

const server = createRealtimeWebSocketServer({ port: 0, heartbeatIntervalMs: 0 });
server.getRoomIds();
