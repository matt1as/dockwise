import fs from 'node:fs/promises';

for (const path of ['dist/index.html', 'dist/assets']) {
  await fs.access(path);
}
const html = await fs.readFile('dist/index.html', 'utf8');
if (!html.includes('Dockwise') || !html.includes('Trust the process')) {
  throw new Error('dist does not contain the Dockwise application');
}
if (/https?:\/\//.test(html)) {
  throw new Error('dist index contains a remote runtime dependency');
}
console.log('Bundled Dockwise build verified.');
