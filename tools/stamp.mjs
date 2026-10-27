// Welfare Avenue website: cache stamps.
// Stylesheets and scripts under /assets/ are cached by browsers for a year, so every page links them with
// ?v=<first 8 characters of the file's md5>. When a file changes, its stamp must change on every page, or
// visitors keep the old file. This script sets every stamp from the files as they are now. It runs on every
// publish (netlify.toml) and in the checks, so nobody has to edit a ?v= value by hand.
// Usage: node tools/stamp.mjs [site folder] [--check]   (--check reports what it would change, writes nothing)
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const site = args.find(a => !a.startsWith('--')) || 'site';
const md8 = p => createHash('md5').update(readFileSync(p)).digest('hex').slice(0, 8);
const walk = (d, out = []) => { for (const n of readdirSync(d)) { const p = join(d, n); statSync(p).isDirectory() ? walk(p, out) : out.push(p); } return out; };
const changed = [];

// 1. Stamps written inside an asset: forms.js loads forms.css with CSS_V = forms.css's stamp.
const inner = [{ file: 'assets/forms.js', re: /(CSS_V\s*=\s*')([0-9a-f]{8})(')/, src: 'assets/forms.css' }];
for (const s of inner) {
  const f = join(site, s.file), src = join(site, s.src);
  if (!existsSync(f) || !existsSync(src)) continue;
  const text = readFileSync(f, 'utf8'), want = md8(src);
  const next = text.replace(s.re, (m, a, b, c) => a + want + c);
  if (next !== text) { changed.push(s.file + ' (CSS_V)'); if (!checkOnly) writeFileSync(f, next); }
}

// 2. ?v= stamps on /assets/ links in pages, stylesheets and scripts.
const cache = {};
const stampOf = name => {
  if (!(name in cache)) { const p = join(site, 'assets', name); cache[name] = existsSync(p) ? md8(p) : null; }
  return cache[name];
};
const re = /(\/assets\/)([A-Za-z0-9_.-]+)\?v=([0-9a-f]+)/g;
for (const f of walk(site).filter(p => /\.(html|css|js)$/.test(p))) {
  const text = readFileSync(f, 'utf8');
  const next = text.replace(re, (m, pre, name) => { const s = stampOf(name); return s ? pre + name + '?v=' + s : m; });
  if (next !== text) { changed.push(relative(site, f)); if (!checkOnly) writeFileSync(f, next); }
}

if (!changed.length) console.log('Cache stamps: all up to date.');
else console.log((checkOnly ? 'Cache stamps that the publish step will update: ' : 'Cache stamps updated in: ') + changed.join(', '));
