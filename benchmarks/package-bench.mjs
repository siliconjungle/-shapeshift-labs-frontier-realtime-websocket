import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { createCommandSource } from '@shapeshift-labs/frontier-realtime';
import { createRealtimeRoom } from '../../frontier-realtime-server/dist/index.js';
import { createRealtimeWebSocketClient } from '../dist/client.js';
import { createRealtimeWebSocketServer } from '../dist/server.js';
import {
  decodeRealtimeWebSocketFrame,
  encodeRealtimeWebSocketFrame
} from '../dist/wire.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const args = parseArgs(process.argv.slice(2));
const rounds = readPositiveInt(args.rounds, 9);
const outPath = args.out ? path.resolve(rootDir, args.out) : null;
let sink = 0;

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
  }
  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }
  open() {
    this.readyState = 1;
    for (const listener of this.listeners.get('open') ?? []) listener({});
  }
}

const source = createCommandSource({ clientId: 'bench', now: () => 1 });
const frames = new Array(128);
for (let i = 0; i < frames.length; i++) {
  frames[i] = { version: 1, type: 'command', command: source.create('move', { dx: i & 3 }, { roomId: 'bench-room' }) };
}
const jsonFrames = frames.map((frame) => encodeRealtimeWebSocketFrame(frame));
const binaryFrames = frames.map((frame) => encodeRealtimeWebSocketFrame(frame, { frameEncoding: 'binary' }));

const room = createRealtimeRoom({
  roomId: 'bench-room',
  initialState: { x: 0 },
  now: () => 1,
  applyCommand: (state, command) => ({ x: state.x + command.payload.dx })
});
const server = createRealtimeWebSocketServer({ port: 0, room, heartbeatIntervalMs: 0 });
await server.ready;

try {
  const rows = [
    runRow('Encode/decode 128 JSON frames', 6000, () => {
      for (let i = 0; i < frames.length; i++) sink += decodeRealtimeWebSocketFrame(jsonFrames[i]).version;
    }),
    runRow('Encode/decode 128 binary frames', 6000, () => {
      for (let i = 0; i < frames.length; i++) sink += decodeRealtimeWebSocketFrame(binaryFrames[i]).version;
    }),
    runRow('Client queue/send 128 commands', 5000, () => {
      const socket = new MemorySocket();
      const ClientWebSocket = class {
        constructor() {
          return socket;
        }
      };
      const client = createRealtimeWebSocketClient({ url: 'ws://bench', WebSocket: ClientWebSocket });
      for (let i = 0; i < frames.length; i++) client.command(frames[i].command);
      socket.open();
      sink += socket.sent.length;
    }),
    runRow('WebSocket server step, 1 room', 8000, () => {
      sink += server.step()[0]?.sent ?? 0;
    })
  ];
  finish('@shapeshift-labs/frontier-realtime-websocket', rows);
} finally {
  await server.close();
}

function measure(fn, inner) {
  for (let i = 0; i < inner; i++) fn();
  const samples = new Array(rounds);
  for (let roundIndex = 0; roundIndex < rounds; roundIndex++) {
    const start = performance.now();
    for (let i = 0; i < inner; i++) fn();
    samples[roundIndex] = ((performance.now() - start) * 1000) / inner;
  }
  samples.sort((left, right) => left - right);
  return { median: percentile(samples, 0.5), p95: percentile(samples, 0.95) };
}

function runRow(name, inner, fn, extra = {}) {
  const timing = measure(fn, inner);
  return { fixture: name, medianUs: round(timing.median), p95Us: round(timing.p95), ...extra };
}

function finish(packageName, rows) {
  const report = {
    package: packageName,
    version: readPackageVersion(),
    generatedAt: new Date().toISOString(),
    node: process.version,
    platform: process.platform + ' ' + process.arch,
    rounds,
    rows
  };
  if (outPath) {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');
  }
  printReport(report);
  if (sink === 42) console.log('sink=' + sink);
}

function printReport(report) {
  console.log(report.package + ' package benchmark');
  console.log('Node ' + report.node + ' on ' + report.platform + ', rounds=' + rounds);
  console.log('These are Frontier-only package measurements, not competitor comparisons.');
  console.log('');
  console.log(padRight('Fixture', 38) + padLeft('Median', 12) + padLeft('p95', 11));
  for (const row of report.rows) {
    console.log(padRight(row.fixture, 38) + padLeft(formatUs(row.medianUs), 12) + padLeft(formatUs(row.p95Us), 11));
  }
  if (outPath) console.log('\nwrote ' + path.relative(rootDir, outPath));
}

function percentile(sorted, fraction) {
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * fraction) - 1))];
}

function readPackageVersion() {
  return JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8')).version;
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--rounds') out.rounds = argv[++i];
    else if (arg === '--out') out.out = argv[++i];
    else if (arg === '--help' || arg === '-h') {
      console.log('Usage: npm run bench -- [--rounds 9] [--out benchmarks/results/package-bench.json]');
      process.exit(0);
    } else {
      throw new Error('unknown argument: ' + arg);
    }
  }
  return out;
}

function readPositiveInt(value, fallback) {
  if (value === undefined) return fallback;
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) throw new Error('expected positive integer, got ' + value);
  return number;
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function formatUs(value) {
  return value >= 1000 ? (value / 1000).toFixed(2) + ' ms' : value.toFixed(2) + ' us';
}

function padRight(value, width) {
  return String(value).padEnd(width);
}

function padLeft(value, width) {
  return String(value).padStart(width);
}
