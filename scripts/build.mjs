import './build-admin.mjs';
import { cp, mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';
await mkdir('dist', { recursive: true });
for (const file of await readdir('.')) {
  if (file.endsWith('.html') || ['robots.txt', 'favicon.svg'].includes(file)) await cp(file, join('dist', file));
}
for (const dir of ['css', 'js', 'data', 'assets', 'admin']) await cp(dir, join('dist', dir), { recursive: true });
console.log('Static site built in dist/');
