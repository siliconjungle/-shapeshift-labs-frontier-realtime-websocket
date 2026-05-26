import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const packageDir = path.dirname(fileURLToPath(import.meta.url));
const documentsDir = path.dirname(packageDir);
const realtimeDir = path.join(documentsDir, 'frontier-realtime');
const crdtWsDir = path.join(documentsDir, 'frontier-crdt-websocket');
const tsc = resolveTsc();

execFileSync(tsc, ['-p', path.join(packageDir, 'tsconfig.json'), '--noEmit'], { stdio: 'inherit' });
execFileSync(tsc, ['-p', path.join(packageDir, 'test/tsconfig.json'), '--noEmit'], { stdio: 'inherit' });

function resolveTsc() {
  const command = process.platform === 'win32' ? 'tsc.cmd' : 'tsc';
  const candidates = [
    path.join(packageDir, 'node_modules', '.bin', command),
    path.join(realtimeDir, 'node_modules', '.bin', command),
    path.join(crdtWsDir, 'node_modules', '.bin', command)
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return command;
}
