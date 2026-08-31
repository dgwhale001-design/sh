import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const template = await readFile(resolve(root, 'site/index.html'), 'utf8');
const logo = await readFile(resolve(root, 'public/brand-logo.png'));
const html = template
  .replaceAll('__LOGO_DATA__', `data:image/png;base64,${logo.toString('base64')}`)
  .replaceAll('__SUPABASE_URL__', process.env.SUPABASE_URL || '')
  .replaceAll('__SUPABASE_ANON_KEY__', process.env.SUPABASE_ANON_KEY || '');
const port = Number(process.env.PORT || 4173);

createServer((request, response) => {
  if (request.url === '/favicon.ico') { response.writeHead(204); response.end(); return; }
  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' });
  response.end(html);
}).listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}`));
