import { WebSocketServer } from 'ws';
import type { RawData, WebSocket, WebSocketServer as WsServer } from 'ws';
import type {
  RealtimeClientMessage,
  RealtimeCommand,
  RealtimeCommandRejection,
  RealtimeRoomId,
  RealtimeServerMessage
} from '@shapeshift-labs/frontier-realtime';
import {
  REALTIME_WEBSOCKET_CLOSE_HEARTBEAT_TIMEOUT,
  REALTIME_WEBSOCKET_CLOSE_POLICY,
  REALTIME_WEBSOCKET_CLOSE_TOO_LARGE,
  REALTIME_WEBSOCKET_CLOSE_UNSUPPORTED,
  REALTIME_WEBSOCKET_DEFAULT_MAX_FRAME_BYTES
} from './constants.js';
import { decodeRealtimeWebSocketFrame, encodeRealtimeWebSocketFrame, RealtimeWebSocketFrameTooLargeError } from './wire.js';
import type {
  RealtimeWebSocketAuthResult,
  RealtimeWebSocketPeer,
  RealtimeWebSocketRoomLike,
  RealtimeWebSocketServer,
  RealtimeWebSocketServerOptions,
  RealtimeWebSocketStepResult
} from './types.js';

interface PeerSocket<TState, TCommand extends RealtimeCommand, TClientSnapshot> {
  socket: WebSocket;
  clientId: string;
  roomId: string;
  room: RealtimeWebSocketRoomLike<TState, TCommand, TClientSnapshot>;
  principal?: unknown;
  pendingHeartbeatNonce?: string;
}

export function createRealtimeWebSocketServer<
  TState = unknown,
  TCommand extends RealtimeCommand = RealtimeCommand,
  TClientSnapshot = TState
>(options: RealtimeWebSocketServerOptions<TState, TCommand, TClientSnapshot> = {}): RealtimeWebSocketServer {
  return new FrontierRealtimeWebSocketServer(options);
}

class FrontierRealtimeWebSocketServer<TState, TCommand extends RealtimeCommand, TClientSnapshot> implements RealtimeWebSocketServer {
  readonly ready: Promise<void>;
  private readonly wss: WsServer;
  private readonly rooms = new Map<string, RealtimeWebSocketRoomLike<TState, TCommand, TClientSnapshot>>();
  private readonly clients = new Map<string, Map<string, WebSocket>>();
  private readonly peers = new Map<WebSocket, PeerSocket<TState, TCommand, TClientSnapshot>>();
  private readonly maxFrameBytes: number;
  private readonly maxBufferedAmount: number;
  private readonly heartbeatIntervalMs: number;
  private readonly heartbeatTimeoutMs: number;
  private heartbeatTimer: ReturnType<typeof setInterval> | undefined;

  constructor(private readonly options: RealtimeWebSocketServerOptions<TState, TCommand, TClientSnapshot>) {
    this.maxFrameBytes = Math.max(1, Math.floor(options.maxFrameBytes ?? options.maxPayload ?? REALTIME_WEBSOCKET_DEFAULT_MAX_FRAME_BYTES));
    this.maxBufferedAmount = Math.max(0, Math.floor(options.maxBufferedAmount ?? 16 * 1024 * 1024));
    this.heartbeatIntervalMs = Math.max(0, Math.floor(options.heartbeatIntervalMs ?? 30000));
    this.heartbeatTimeoutMs = Math.max(1, Math.floor(options.heartbeatTimeoutMs ?? 10000));
    if (options.room) this.rooms.set(options.room.roomId, options.room);
    this.wss = new WebSocketServer({
      port: options.port,
      host: options.host,
      path: options.path,
      server: options.server as never,
      perMessageDeflate: options.perMessageDeflate ?? false,
      maxPayload: this.maxFrameBytes
    });
    this.ready = new Promise((resolve, reject) => {
      const address = this.wss.address();
      if (address !== null) {
        resolve();
        return;
      }
      this.wss.once('listening', resolve);
      this.wss.once('error', reject);
    });
    this.wss.on('connection', (socket, request) => this.handleConnection(socket, request));
    this.startHeartbeat();
  }

  address(): unknown {
    return this.wss.address();
  }

  getRoomIds(): RealtimeRoomId[] {
    return Array.from(this.rooms.keys()).sort();
  }

  getClientIds(roomId?: RealtimeRoomId): string[] {
    if (roomId !== undefined) return Array.from(this.clients.get(roomId)?.keys() ?? []).sort();
    const ids = new Set<string>();
    this.clients.forEach((room) => room.forEach((_socket, clientId) => ids.add(clientId)));
    return Array.from(ids).sort();
  }

  step(roomId?: RealtimeRoomId, count = 1): RealtimeWebSocketStepResult[] {
    const roomIds = roomId === undefined ? this.getRoomIds() : [roomId];
    const results: RealtimeWebSocketStepResult[] = [];
    for (const id of roomIds) {
      const room = this.rooms.get(id);
      if (!room) continue;
      const step = room.step(count);
      let sent = 0;
      const sockets = this.clients.get(id);
      sockets?.forEach((socket, clientId) => {
        sent += this.send(socket, { version: 1, type: 'snapshot', roomId: id, snapshot: room.snapshotFor(clientId) });
      });
      for (const ack of step.accepted) {
        const socket = this.clients.get(id)?.get(ack.clientId);
        if (socket) sent += this.send(socket, { version: 1, type: 'command-ack', ack });
      }
      for (const rejection of step.rejected) {
        const socket = this.clients.get(id)?.get(rejection.clientId);
        if (socket) sent += this.send(socket, { version: 1, type: 'command-reject', rejection });
      }
      results.push({ roomId: id, snapshot: step.snapshot, sent, accepted: step.accepted.length, rejected: step.rejected.length });
    }
    return results;
  }

  close(): Promise<void> {
    if (this.heartbeatTimer !== undefined) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
    for (const socket of this.peers.keys()) socket.close();
    this.peers.clear();
    this.clients.clear();
    return new Promise((resolve, reject) => {
      this.wss.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  private handleConnection(socket: WebSocket, request?: unknown): void {
    socket.on('message', (data) => {
      this.handleSocketMessage(socket, data, request).catch(() => socket.close(1011, 'Frontier realtime WebSocket server error'));
    });
    socket.on('error', () => this.removeSocket(socket));
    socket.on('close', () => this.removeSocket(socket));
  }

  private async handleSocketMessage(socket: WebSocket, data: RawData, request?: unknown): Promise<void> {
    let message: RealtimeClientMessage;
    try {
      message = decodeRealtimeWebSocketFrame(data, { maxFrameBytes: this.maxFrameBytes }) as RealtimeClientMessage;
    } catch (error) {
      socket.close(error instanceof RealtimeWebSocketFrameTooLargeError ? REALTIME_WEBSOCKET_CLOSE_TOO_LARGE : REALTIME_WEBSOCKET_CLOSE_UNSUPPORTED, 'invalid Frontier realtime WebSocket frame');
      return;
    }
    if (message.type === 'join') {
      await this.register(socket, message, request);
      return;
    }
    const peer = this.peers.get(socket);
    if (!peer) {
      socket.close(REALTIME_WEBSOCKET_CLOSE_POLICY, 'join required');
      return;
    }
    if (message.type === 'command') {
      const command = message.command as TCommand;
      if (command.clientId !== peer.clientId || (message.roomId !== undefined && message.roomId !== peer.roomId)) {
        this.send(socket, { version: 1, type: 'command-reject', rejection: rejectCommand(command, 'wrong room or client') });
        return;
      }
      const result = peer.room.enqueue(command);
      if (!result.accepted && result.rejection) this.send(socket, { version: 1, type: 'command-reject', rejection: result.rejection });
      return;
    }
    if (message.type === 'leave') {
      this.removeSocket(socket);
      socket.close(1000, 'left room');
      return;
    }
    if (message.type === 'pong') {
      peer.pendingHeartbeatNonce = undefined;
    }
  }

  private async register(socket: WebSocket, message: Extract<RealtimeClientMessage, { type: 'join' }>, request?: unknown): Promise<void> {
    const auth = normalizeAuthResult(await this.options.authenticate?.({ request, message }));
    if (!auth.ok) {
      socket.close(auth.closeCode, auth.reason);
      return;
    }
    const room = await this.resolveRoom(message.roomId);
    if (!room) {
      socket.close(REALTIME_WEBSOCKET_CLOSE_POLICY, 'unknown room');
      return;
    }
    const existing = this.clients.get(message.roomId)?.get(message.clientId);
    if (existing && existing !== socket) {
      existing.close(1000, 'client replaced');
      this.removeSocket(existing);
    }
    this.removeSocket(socket);
    let roomClients = this.clients.get(message.roomId);
    if (!roomClients) {
      roomClients = new Map();
      this.clients.set(message.roomId, roomClients);
    }
    roomClients.set(message.clientId, socket);
    this.rooms.set(message.roomId, room);
    this.peers.set(socket, { socket, clientId: message.clientId, roomId: message.roomId, room, principal: auth.principal });
    this.send(socket, room.join(message.clientId));
  }

  private async resolveRoom(roomId: string): Promise<RealtimeWebSocketRoomLike<TState, TCommand, TClientSnapshot> | null> {
    const existing = this.rooms.get(roomId);
    if (existing) return existing;
    const resolved = await this.options.resolveRoom?.(roomId);
    if (!resolved) return null;
    this.rooms.set(roomId, resolved);
    return resolved;
  }

  private removeSocket(socket: WebSocket): void {
    const peer = this.peers.get(socket);
    if (!peer) return;
    this.peers.delete(socket);
    const clients = this.clients.get(peer.roomId);
    if (clients?.get(peer.clientId) === socket) {
      clients.delete(peer.clientId);
      if (clients.size === 0) this.clients.delete(peer.roomId);
    }
    peer.room.leave(peer.clientId);
  }

  private send(socket: WebSocket, message: RealtimeServerMessage): number {
    if (socket.readyState !== socket.OPEN) return 0;
    if (socket.bufferedAmount > this.maxBufferedAmount) {
      socket.close(REALTIME_WEBSOCKET_CLOSE_TOO_LARGE, 'backpressure');
      return 0;
    }
    socket.send(encodeRealtimeWebSocketFrame(message, {
      frameEncoding: this.options.frameEncoding,
      maxFrameBytes: this.maxFrameBytes
    }));
    return 1;
  }

  private startHeartbeat(): void {
    if (this.heartbeatIntervalMs <= 0) return;
    this.heartbeatTimer = setInterval(() => {
      const nonce = String(Date.now());
      for (const peer of this.peers.values()) {
        if (peer.pendingHeartbeatNonce !== undefined) {
          peer.socket.close(REALTIME_WEBSOCKET_CLOSE_HEARTBEAT_TIMEOUT, 'heartbeat timeout');
          this.removeSocket(peer.socket);
          continue;
        }
        peer.pendingHeartbeatNonce = nonce;
        this.send(peer.socket, { version: 1, type: 'ping', nonce, timeMs: Date.now() });
      }
    }, this.heartbeatIntervalMs);
  }
}

function rejectCommand(command: RealtimeCommand, reason: string): RealtimeCommandRejection {
  return { clientId: command.clientId, seq: command.seq, commandId: command.id, reason };
}

function normalizeAuthResult(value: RealtimeWebSocketAuthResult): { ok: boolean; closeCode: number; reason: string; principal?: unknown } {
  if (value === undefined || value === true) return { ok: true, closeCode: 1000, reason: 'ok' };
  if (value === false) return { ok: false, closeCode: REALTIME_WEBSOCKET_CLOSE_POLICY, reason: 'authentication rejected' };
  return {
    ok: value.ok !== false,
    closeCode: value.closeCode ?? REALTIME_WEBSOCKET_CLOSE_POLICY,
    reason: value.reason ?? 'authentication rejected',
    principal: value.principal
  };
}
