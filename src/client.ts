import type {
  RealtimeClientMessage,
  RealtimeCommand,
  RealtimeRoomId,
  RealtimeServerMessage
} from '@shapeshift-labs/frontier-realtime';
import { decodeRealtimeWebSocketFrame, encodeRealtimeWebSocketFrame } from './wire.js';
import type {
  RealtimeWebSocketClient,
  RealtimeWebSocketClientOptions,
  RealtimeWebSocketFrameEncoding,
  RealtimeWebSocketLike,
  RealtimeWebSocketMessageCallback,
  RealtimeWebSocketUnsubscribe
} from './types.js';

const SOCKET_OPEN = 1;

export function createRealtimeWebSocketClient<TServerMessage extends RealtimeServerMessage = RealtimeServerMessage>(
  options: RealtimeWebSocketClientOptions<TServerMessage>
): RealtimeWebSocketClient<TServerMessage> {
  const WebSocketConstructor = options.WebSocket ?? (globalThis as unknown as { WebSocket?: RealtimeWebSocketClientOptions['WebSocket'] }).WebSocket;
  if (!WebSocketConstructor) throw new TypeError('WebSocket constructor is required');
  const socket = new WebSocketConstructor(options.url, options.protocols);
  const listeners = new Set<RealtimeWebSocketMessageCallback<TServerMessage>>();
  const queue: RealtimeClientMessage[] = [];
  let opened = false;
  let closed = false;
  let resolveReady: () => void = () => undefined;
  let rejectReady: (error: unknown) => void = () => undefined;
  const ready = new Promise<void>((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });

  const client: RealtimeWebSocketClient<TServerMessage> = {
    socket,
    ready,
    get closed() {
      return closed;
    },
    send(message: RealtimeClientMessage) {
      if (closed) throw new Error('Realtime WebSocket client is closed');
      if (!opened && !isOpen(socket)) {
        queue.push(message);
        return;
      }
      sendNow(socket, message, options);
    },
    join(roomId = options.roomId, clientId = options.clientId, token = options.token) {
      if (!roomId) throw new TypeError('roomId is required');
      if (!clientId) throw new TypeError('clientId is required');
      client.send({ version: 1, type: 'join', roomId, clientId, token });
    },
    command<TCommand extends RealtimeCommand>(command: TCommand, roomId?: RealtimeRoomId) {
      client.send({ version: 1, type: 'command', command, roomId });
    },
    leave(roomId = options.roomId) {
      client.send({ version: 1, type: 'leave', roomId });
    },
    pong(nonce?: string, timeMs?: number) {
      client.send({ version: 1, type: 'pong', nonce, timeMs });
    },
    onMessage(callback: RealtimeWebSocketMessageCallback<TServerMessage>): RealtimeWebSocketUnsubscribe {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    close(code?: number, reason?: string) {
      closed = true;
      socket.close(code, reason);
    }
  };

  if (options.onMessage) listeners.add(options.onMessage);

  addListener(socket, 'open', () => {
    opened = true;
    options.onOpen?.();
    resolveReady();
    if (options.autoJoin !== false && options.roomId && options.clientId) client.join();
    while (queue.length > 0) sendNow(socket, queue.shift() as RealtimeClientMessage, options);
  });
  addListener(socket, 'message', (event) => {
    const data = readMessageData(event);
    const message = decodeRealtimeWebSocketFrame(data, { maxFrameBytes: options.maxFrameBytes }) as TServerMessage;
    for (const listener of Array.from(listeners)) listener(message);
    if (message.type === 'ping') client.pong(message.nonce, Date.now());
  });
  addListener(socket, 'close', (event) => {
    closed = true;
    options.onClose?.(event);
  });
  addListener(socket, 'error', (event) => {
    if (!opened) rejectReady(event);
    options.onError?.(event);
  });

  return client;
}

function sendNow(
  socket: RealtimeWebSocketLike,
  message: RealtimeClientMessage,
  options: { readonly frameEncoding?: RealtimeWebSocketFrameEncoding; readonly maxFrameBytes?: number }
): void {
  socket.send(encodeRealtimeWebSocketFrame(message, {
    frameEncoding: options.frameEncoding,
    maxFrameBytes: options.maxFrameBytes
  }));
}

function isOpen(socket: RealtimeWebSocketLike): boolean {
  return socket.readyState === (socket.OPEN ?? SOCKET_OPEN);
}

function readMessageData(event: unknown): unknown {
  return typeof event === 'object' && event !== null && 'data' in event ? (event as { data: unknown }).data : event;
}

function addListener(socket: RealtimeWebSocketLike, event: 'open' | 'message' | 'close' | 'error', listener: (...args: unknown[]) => void): void {
  if (socket.addEventListener) socket.addEventListener(event, listener);
  else if (socket.on) socket.on(event, listener);
}
