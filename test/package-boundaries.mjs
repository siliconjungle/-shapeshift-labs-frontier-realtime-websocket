import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));

const expectedExports = ['.', './client', './server', './wire', './package.json'];
assert.deepStrictEqual(Object.keys(pkg.exports).sort(), expectedExports.sort());
assert.strictEqual(pkg.sideEffects, false);
assert.deepStrictEqual(Object.keys(pkg.dependencies).sort(), ['@shapeshift-labs/frontier-realtime', 'ws'].sort());

const rootJs = fs.readFileSync(path.join(rootDir, 'dist/index.js'), 'utf8');
const clientJs = fs.readFileSync(path.join(rootDir, 'dist/client.js'), 'utf8');
assert.strictEqual(rootJs.includes("from 'ws'"), false);
assert.strictEqual(rootJs.includes('from "ws"'), false);
assert.strictEqual(clientJs.includes("from 'ws'"), false);
assert.strictEqual(clientJs.includes('from "ws"'), false);
assert.ok(fs.readFileSync(path.join(rootDir, 'dist/server.js'), 'utf8').includes("from 'ws'"));

for (const [key, value] of Object.entries(pkg.exports)) {
  if (key === './package.json') continue;
  assert.ok(fs.existsSync(path.join(rootDir, value.import)), key + ' import target exists');
  assert.ok(fs.existsSync(path.join(rootDir, value.types)), key + ' types target exists');
  const mod = await import(path.join(rootDir, value.import));
  assert.ok(Object.keys(mod).length > 0, key + ' exports values');
}

console.log('frontier realtime websocket package boundaries passed');
