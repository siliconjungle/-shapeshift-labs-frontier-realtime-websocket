import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const packageDir = path.dirname(fileURLToPath(import.meta.url));
const documentsDir = path.dirname(packageDir);
const realtimeDir = path.join(documentsDir, 'frontier-realtime');
const realtimeServerDir = path.join(documentsDir, 'frontier-realtime-server');
const crdtWsDir = path.join(documentsDir, 'frontier-crdt-websocket');

linkLocalPackage('@shapeshift-labs/frontier-realtime', realtimeDir);
linkLocalPackage('@shapeshift-labs/frontier-realtime-server', realtimeServerDir);
linkLocalPackage('ws', path.join(crdtWsDir, 'node_modules/ws'));
linkLocalPackage('@types/ws', path.join(crdtWsDir, 'node_modules/@types/ws'));
linkLocalPackage('@types/node', path.join(crdtWsDir, 'node_modules/@types/node'));
linkLocalPackage('undici-types', path.join(crdtWsDir, 'node_modules/undici-types'));

if (fs.existsSync(path.join(realtimeDir, 'package.json'))) {
  execFileSync('npm', ['--prefix', realtimeDir, 'run', 'build'], { stdio: 'inherit' });
}
if (fs.existsSync(path.join(realtimeServerDir, 'package.json'))) {
  execFileSync('npm', ['--prefix', realtimeServerDir, 'run', 'build'], { stdio: 'inherit' });
}

fs.rmSync(path.join(packageDir, 'dist'), { recursive: true, force: true });
execFileSync(resolveTsc(), ['-b', path.join(packageDir, 'tsconfig.json'), '--force'], { stdio: 'inherit' });

function linkLocalPackage(name, targetDir) {
  if (!fs.existsSync(path.join(targetDir, 'package.json'))) return;
  const parts = name.split('/');
  const scopeDir = path.join(packageDir, 'node_modules', ...parts.slice(0, -1));
  const linkPath = path.join(packageDir, 'node_modules', ...parts);
  fs.mkdirSync(scopeDir, { recursive: true });
  try {
    const stat = fs.lstatSync(linkPath);
    if (!stat.isSymbolicLink()) return;
    fs.unlinkSync(linkPath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  fs.symlinkSync(path.relative(path.dirname(linkPath), targetDir), linkPath, 'dir');
}

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
