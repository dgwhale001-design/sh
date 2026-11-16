import { readFile } from 'node:fs/promises';

const sourceHtml = await readFile(new URL('../site/index.html', import.meta.url), 'utf8');
const specialJs = await readFile(new URL('../site/special-program.js', import.meta.url), 'utf8');
const builtHtml = await readFile(new URL('../dist/public/index.html', import.meta.url), 'utf8');

const referencedIds = [...specialJs.matchAll(/getElementById\('([^']+)'\)/g)].map((match) => match[1]);
const missingIds = [...new Set(referencedIds)].filter(
  (id) => !sourceHtml.includes('id="' + id + '"') && !specialJs.includes('id="' + id + '"'),
);
if (missingIds.length) throw new Error('Missing DOM ids: ' + missingIds.join(', '));

const inlineScripts = [...sourceHtml.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map((match) => match[1])
  .filter((script) => !script.includes('__SPECIAL_PROGRAM_JS__'));
for (const script of inlineScripts) new Function(script);
new Function(specialJs);

const failures = [];
if (builtHtml.includes('__SPECIAL_PROGRAM_CSS__')) failures.push('CSS placeholder remains');
if (builtHtml.includes('__SPECIAL_PROGRAM_JS__')) failures.push('JS placeholder remains');
if (!builtHtml.includes('data-panel="intensive"')) failures.push('intensive panel missing');
if (!builtHtml.includes('id="special-enrollment-list"')) failures.push('enrollment UI missing');
if (failures.length) throw new Error(failures.join(', '));

console.log('Special program verified: ' + new Set(referencedIds).size + ' DOM refs, ' + (inlineScripts.length + 1) + ' scripts, ' + builtHtml.length + ' byte build');
