/* Collects what the desktop app runs: the OS server, its web UI, the built Suite apps and the few runtime packages. */
import fs from 'node:fs'; import path from 'node:path'; import { execSync } from 'node:child_process'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, '..'), out = path.join(here, 'stage');
const suiteDist = process.env.SUITE_DIST || path.join(root, 'suite', 'dist');
if (!fs.existsSync(path.join(suiteDist, 'apps'))) { console.error('No built Suite at ' + suiteDist + ' (run: bash suite/build.sh <workdir> <out>, then set SUITE_DIST=<out>)'); process.exit(1); }
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const cp = (a, b) => fs.cpSync(a, b, { recursive: true, dereference: true });
cp(path.join(root, 'server'), path.join(out, 'server')); cp(path.join(root, 'web'), path.join(out, 'web'));
fs.mkdirSync(path.join(out, 'suite'), { recursive: true }); cp(path.join(root, 'suite', 'shim'), path.join(out, 'suite', 'shim')); cp(suiteDist, path.join(out, 'suite', 'dist'));
for (const f of ['package.json', 'package-lock.json', 'UPSTREAM-LICENSE-MIT.txt']) if (fs.existsSync(path.join(root, f))) fs.copyFileSync(path.join(root, f), path.join(out, f));
execSync('npm ci --omit=dev --ignore-scripts', { cwd: out, stdio: 'inherit' });
console.log('staged ->', out);
