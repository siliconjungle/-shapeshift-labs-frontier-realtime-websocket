import assert from 'node:assert';
import { createCommandSource } from '@shapeshift-labs/frontier-realtime';
import {
  decodeRealtimeWebSocketFrame,
  encodeRealtimeWebSocketFrame
} from '../dist/index.js';

const args = parseArgs(process.argv.slice(2));
const cases = readPositiveInt(args.cases, 200);
const seed = readPositiveInt(args.seed, 0x45f7);
const rng = mulberry32(seed);

for (let caseId = 0; caseId < cases; caseId++) {
  const local = mulberry32((rng() * 0xffffffff) >>> 0);
  const source = createCommandSource({ clientId: 'client-' + caseId, now: () => caseId });
  const messages = [
    { version: 1, type: 'join', roomId: 'room-' + randomInt(local, 8), clientId: 'client-' + caseId },
    { version: 1, type: 'command', command: source.create('add', { delta: randomInt(local, 5) }, { roomId: 'room-1' }) },
    { version: 1, type: 'leave', roomId: 'room-1' },
    { version: 1, type: 'snapshot', snapshot: { tick: randomInt(local, 1000), state: { total: randomInt(local, 1000) } } },
    { version: 1, type: 'command-ack', ack: { clientId: 'client-' + caseId, seq: 1 } },
    { version: 1, type: 'command-reject', rejection: { clientId: 'client-' + caseId, seq: 2, reason: 'fuzz' } },
    { version: 1, type: 'ping', nonce: 'n' + caseId, timeMs: caseId }
  ];
  for (const message of messages) {
    const expected = JSON.parse(JSON.stringify(message));
    assert.deepStrictEqual(decodeRealtimeWebSocketFrame(encodeRealtimeWebSocketFrame(message)), expected);
    assert.deepStrictEqual(
      JSON.parse(JSON.stringify(decodeRealtimeWebSocketFrame(encodeRealtimeWebSocketFrame(message, { frameEncoding: 'binary' })))),
      expected
    );
  }
}

console.log('frontier realtime websocket fuzz passed cases=' + cases + ' seed=' + seed);

function randomInt(rng, max) {
  return Math.floor(rng() * max);
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--cases') out.cases = argv[++i];
    else if (arg === '--seed') out.seed = argv[++i];
    else throw new Error('unknown argument: ' + arg);
  }
  return out;
}

function readPositiveInt(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : fallback;
}

function mulberry32(seed) {
  let value = seed >>> 0;
  return function next() {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
