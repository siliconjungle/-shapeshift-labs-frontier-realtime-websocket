import type {
  RealtimeClientCommandMessage,
  RealtimeClientId,
  RealtimeClientMessage,
  RealtimeCommand,
  RealtimeDelta,
  RealtimeRoomId,
  RealtimeServerMessage,
  RealtimeSnapshot
} from '@shapeshift-labs/frontier-realtime';

export type RealtimeWebSocketFrame = RealtimeClientMessage | RealtimeServerMessage;
export type RealtimeWebSocketFrameEncoding = 'json' | 'binary';
export type RealtimeWebSocketEventName = 'open' | 'message' | 'close' | 'error';
export type RealtimeWebSocketMessageCallback<TMessage = RealtimeServerMessage> = (message: TMessage) => void;
export type RealtimeWebSocketUnsubscribe = () => void;

export interface RealtimeWebSocketLike {
  readonly readyState: number;
  readonly bufferedAmount?: number;
  readonly OPEN?: number;
  send(data: string | Uint8Array): void;
  close(code?: number, reason?: string): void;
  addEventListener?(type: RealtimeWebSocketEventName, listener: (...args: unknown[]) => void): void;
  removeEventListener?(type: RealtimeWebSocketEventName, listener: (...args: unknown[]) => void): void;
  on?(type: RealtimeWebSocketEventName, listener: (...args: unknown[]) => void): void;
  off?(type: RealtimeWebSocketEventName, listener: (...args: unknown[]) => void): void;
}

export interface RealtimeWebSocketConstructor {
  new (url: string, protocols?: string | string[]): RealtimeWebSocketLike;
}

export interface RealtimeWebSocketClientOptions<TMessage extends RealtimeServerMessage = RealtimeServerMessage> {
  readonly url: string;
  readonly WebSocket?: RealtimeWebSocketConstructor;
  readonly protocols?: string | string[];
  readonly clientId?: RealtimeClientId;
  readonly roomId?: RealtimeRoomId;
  readonly token?: string;
  readonly sessionId?: string;
  readonly resumeToken?: string;
  readonly lastSeenTick?: number;
  readonly autoJoin?: boolean;
  readonly frameEncoding?: RealtimeWebSocketFrameEncoding;
  readonly maxFrameBytes?: number;
  readonly onMessage?: RealtimeWebSocketMessageCallback<TMessage>;
  readonly onOpen?: () => void;
  readonly onClose?: (event?: unknown) => void;
  readonly onError?: (event?: unknown) => void;
}

export interface RealtimeWebSocketClient<TServerMessage extends RealtimeServerMessage = RealtimeServerMessage> {
  readonly socket: RealtimeWebSocketLike;
  readonly ready: Promise<void>;
  readonly closed: boolean;
  send(message: RealtimeClientMessage): void;
  join(roomId?: RealtimeRoomId, clientId?: RealtimeClientId, token?: string, resume?: RealtimeWebSocketResumeOptions): void;
  command<TCommand extends RealtimeCommand>(command: TCommand, roomId?: RealtimeRoomId): void;
  leave(roomId?: RealtimeRoomId): void;
  pong(nonce?: string, timeMs?: number): void;
  onMessage(callback: RealtimeWebSocketMessageCallback<TServerMessage>): RealtimeWebSocketUnsubscribe;
  close(code?: number, reason?: string): void;
}

export interface RealtimeWebSocketDecodeOptions {
  readonly maxFrameBytes?: number;
}

export interface RealtimeWebSocketEncodeOptions {
  readonly frameEncoding?: RealtimeWebSocketFrameEncoding;
  readonly maxFrameBytes?: number;
}

export interface RealtimeWebSocketResumeOptions {
  readonly sessionId?: string;
  readonly resumeToken?: string;
  readonly lastSeenTick?: number;
}

export interface RealtimeWebSocketRoomLike<TState = unknown, TCommand extends RealtimeCommand = RealtimeCommand, TClientSnapshot = TState> {
  readonly roomId: RealtimeRoomId;
  join(clientId: RealtimeClientId, options?: RealtimeWebSocketResumeOptions): RealtimeServerMessage<TClientSnapshot>;
  leave(clientId: RealtimeClientId): boolean;
  enqueue(command: TCommand): RealtimeWebSocketCommandEnqueueResult;
  step(count?: number): {
    readonly snapshot: RealtimeSnapshot<TClientSnapshot>;
    readonly accepted: readonly { readonly clientId: RealtimeClientId; readonly seq: number; readonly commandId?: string }[];
    readonly rejected: readonly { readonly clientId: RealtimeClientId; readonly seq: number; readonly reason: string; readonly commandId?: string }[];
  };
  snapshotFor(clientId?: RealtimeClientId): RealtimeSnapshot<TClientSnapshot>;
}

export interface RealtimeWebSocketCommandEnqueueResult {
  readonly accepted: boolean;
  readonly queued: boolean;
  readonly rejection?: {
    readonly clientId: RealtimeClientId;
    readonly seq: number;
    readonly reason: string;
    readonly commandId?: string;
  };
}

export type RealtimeWebSocketRoomResolver<TState = unknown, TCommand extends RealtimeCommand = RealtimeCommand, TClientSnapshot = TState> = (
  roomId: RealtimeRoomId
) => RealtimeWebSocketRoomLike<TState, TCommand, TClientSnapshot> | null | undefined | Promise<RealtimeWebSocketRoomLike<TState, TCommand, TClientSnapshot> | null | undefined>;

export interface RealtimeWebSocketServerAuthContext {
  readonly request?: unknown;
  readonly message?: RealtimeClientMessage;
}

export type RealtimeWebSocketAuthResult =
  | boolean
  | void
  | {
    readonly ok?: boolean;
    readonly closeCode?: number;
    readonly reason?: string;
    readonly principal?: unknown;
  };

export interface RealtimeWebSocketServerOptions<TState = unknown, TCommand extends RealtimeCommand = RealtimeCommand, TClientSnapshot = TState> {
  readonly port?: number;
  readonly host?: string;
  readonly path?: string;
  readonly server?: unknown;
  readonly perMessageDeflate?: boolean;
  readonly maxFrameBytes?: number;
  readonly maxPayload?: number;
  readonly maxBufferedAmount?: number;
  readonly frameEncoding?: RealtimeWebSocketFrameEncoding;
  readonly heartbeatIntervalMs?: number;
  readonly heartbeatTimeoutMs?: number;
  readonly room?: RealtimeWebSocketRoomLike<TState, TCommand, TClientSnapshot>;
  readonly resolveRoom?: RealtimeWebSocketRoomResolver<TState, TCommand, TClientSnapshot>;
  readonly createDelta?: (
    previous: RealtimeSnapshot<TClientSnapshot>,
    next: RealtimeSnapshot<TClientSnapshot>,
    context: { readonly roomId: RealtimeRoomId; readonly clientId: RealtimeClientId }
  ) => RealtimeDelta | null | undefined;
  readonly authenticate?: (context: RealtimeWebSocketServerAuthContext) => RealtimeWebSocketAuthResult | Promise<RealtimeWebSocketAuthResult>;
}

export interface RealtimeWebSocketPeer {
  readonly clientId: RealtimeClientId;
  readonly roomId: RealtimeRoomId;
  readonly principal?: unknown;
}

export interface RealtimeWebSocketStepResult<TState = unknown, TClientSnapshot = TState> {
  readonly roomId: RealtimeRoomId;
  readonly snapshot: RealtimeSnapshot<TClientSnapshot>;
  readonly sent: number;
  readonly deltas: number;
  readonly accepted: number;
  readonly rejected: number;
}

export interface RealtimeWebSocketServer {
  readonly ready: Promise<void>;
  address(): unknown;
  close(): Promise<void>;
  step(roomId?: RealtimeRoomId, count?: number): RealtimeWebSocketStepResult[];
  getRoomIds(): RealtimeRoomId[];
  getClientIds(roomId?: RealtimeRoomId): RealtimeClientId[];
}

export type RealtimeWebSocketClientCommandMessage<TCommand extends RealtimeCommand = RealtimeCommand> =
  RealtimeClientCommandMessage<TCommand>;
