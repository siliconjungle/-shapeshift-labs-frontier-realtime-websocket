import {
  decodeRealtimeBinaryMessage,
  decodeRealtimeMessage,
  encodeRealtimeBinaryMessage,
  encodeRealtimeMessage,
  isRealtimeBinaryMessage,
  validateRealtimeMessageEnvelope
} from '@shapeshift-labs/frontier-realtime';
import { REALTIME_WEBSOCKET_DEFAULT_MAX_FRAME_BYTES } from './constants.js';
import type {
  RealtimeWebSocketDecodeOptions,
  RealtimeWebSocketEncodeOptions,
  RealtimeWebSocketFrame
} from './types.js';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export class RealtimeWebSocketFrameTooLargeError extends Error {
  readonly bytes: number;
  readonly maxFrameBytes: number;

  constructor(bytes: number, maxFrameBytes: number) {
    super('Frontier realtime WebSocket frame exceeds maxFrameBytes');
    this.name = 'RealtimeWebSocketFrameTooLargeError';
    this.bytes = bytes;
    this.maxFrameBytes = maxFrameBytes;
  }
}

export function encodeRealtimeWebSocketFrame(
  message: RealtimeWebSocketFrame,
  options: RealtimeWebSocketEncodeOptions = {}
): string | Uint8Array {
  validateRealtimeMessageEnvelope(message);
  if (options.frameEncoding === 'binary') {
    const bytes = encodeRealtimeBinaryMessage(message);
    assertMaxBytes(bytes.byteLength, options.maxFrameBytes);
    return bytes;
  }
  const json = encodeRealtimeMessage(message);
  assertMaxBytes(byteLength(json), options.maxFrameBytes);
  return json;
}

export function decodeRealtimeWebSocketFrame(
  data: unknown,
  options: RealtimeWebSocketDecodeOptions = {}
): RealtimeWebSocketFrame {
  if (isRealtimeBinaryMessage(data)) {
    assertMaxBytes(realtimeWebSocketFrameBytes(data), options.maxFrameBytes);
    return decodeRealtimeBinaryMessage(data as ArrayBuffer | ArrayBufferView);
  }
  const json = decodeData(data, options.maxFrameBytes);
  return decodeRealtimeMessage(json);
}

export function realtimeWebSocketFrameBytes(data: unknown): number {
  if (typeof data === 'string') return byteLength(data);
  if (data instanceof ArrayBuffer) return data.byteLength;
  if (ArrayBuffer.isView(data)) return data.byteLength;
  if (Array.isArray(data)) return data.reduce((sum, part) => sum + realtimeWebSocketFrameBytes(part), 0);
  return byteLength(String(data));
}

function decodeData(data: unknown, maxFrameBytes = REALTIME_WEBSOCKET_DEFAULT_MAX_FRAME_BYTES): string {
  const bytes = realtimeWebSocketFrameBytes(data);
  assertMaxBytes(bytes, maxFrameBytes);
  if (typeof data === 'string') return data;
  if (data instanceof ArrayBuffer) return decoder.decode(new Uint8Array(data));
  if (ArrayBuffer.isView(data)) return decoder.decode(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
  if (Array.isArray(data)) return decoder.decode(concatBytes(data));
  return String(data);
}

function concatBytes(parts: readonly unknown[]): Uint8Array {
  const total = parts.reduce<number>((sum, part) => sum + realtimeWebSocketFrameBytes(part), 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    let view: Uint8Array;
    if (part instanceof ArrayBuffer) view = new Uint8Array(part);
    else if (ArrayBuffer.isView(part)) {
      const bytes = part as Uint8Array;
      view = new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    }
    else view = encoder.encode(String(part));
    out.set(view, offset);
    offset += view.byteLength;
  }
  return out;
}

function assertMaxBytes(bytes: number, maxFrameBytes = REALTIME_WEBSOCKET_DEFAULT_MAX_FRAME_BYTES): void {
  if (!Number.isSafeInteger(maxFrameBytes) || maxFrameBytes < 1) throw new TypeError('maxFrameBytes must be a positive safe integer');
  if (bytes > maxFrameBytes) throw new RealtimeWebSocketFrameTooLargeError(bytes, maxFrameBytes);
}

function byteLength(value: string): number {
  return encoder.encode(value).byteLength;
}
