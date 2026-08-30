import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const template = await readFile(resolve(root, 'site/index.html'), 'utf8');
const logo = await readFile(resolve(root, 'public/brand-logo.png'));
const html = template.replace('__LOGO_DATA__', `data:image/png;base64,${logo.toString('base64')}`);
const worker = `const html=${JSON.stringify(html)};\nexport default {async fetch(request){const url=new URL(request.url);if(url.pathname==='/favicon.ico'){return new Response(null,{status:204});}return new Response(html,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-cache'}});}};\n`;

await mkdir(resolve(root, 'dist/server'), { recursive: true });
await writeFile(resolve(root, 'dist/server/index.js'), worker, 'utf8');
console.log('Built dist/server/index.js');
