// Welfare Avenue website: the house-rule checks.
// Runs on every pull request (GitHub Actions) and on every publish (netlify.toml), after tools/stamp.mjs.
// A FAIL stops the publish, so the live site never gets a change that breaks a rule. A WARN is advice.
// Each message says what is wrong, why it matters and how to fix it, in plain words, for people and AI tools alike.
// Usage: node tools/check.mjs [site folder] [--stamped]
// --stamped is for the publish step and the Site checks, which run tools/stamp.mjs first: it also confirms every cache
// stamp is right. Run without it when you check your own work (never run stamp.mjs yourself or commit ?v= changes).
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, posix } from 'node:path';

const site = process.argv.slice(2).find(a => !a.startsWith('--')) || 'site';
const stamped = process.argv.includes('--stamped');
const ORIGIN = 'https://welfareavenue.com';
const fails = [], warns = [];
const fail = (file, line, msg) => fails.push(`FAIL ${file}${line ? ':' + line : ''}  ${msg}`);
const warn = (file, line, msg) => warns.push(`WARN ${file}${line ? ':' + line : ''}  ${msg}`);
const walk = (d, out = []) => { for (const n of readdirSync(d)) { const p = join(d, n); statSync(p).isDirectory() ? walk(p, out) : out.push(p); } return out; };
const all = walk(site).map(p => relative(site, p).split('\\').join('/'));
const has = new Set(all);
const md8 = p => createHash('md5').update(readFileSync(join(site, p))).digest('hex').slice(0, 8);
const lineOf = (text, idx) => text.slice(0, idx).split('\n').length;

// ---- required files
for (const f of ['index.html', 'fr/index.html', '404.html', '_headers', '_redirects']) if (!has.has(f)) fail(f, 0, 'This file must exist. Restore it from the main branch.');

// ---- the security policy (CSP) from _headers
const headers = has.has('_headers') ? readFileSync(join(site, '_headers'), 'utf8') : '';
const cspLine = (headers.match(/Content-Security-Policy:\s*(.+)/) || [])[1] || '';
if (!cspLine) fail('_headers', 0, 'The Content-Security-Policy line is missing. It protects visitors; restore it from the main branch.');
const csp = {};
for (const part of cspLine.split(';')) { const [k, ...v] = part.trim().split(/\s+/); if (k) csp[k] = v; }
const allowed = (directive, url) => {
  const list = csp[directive] || csp['default-src'] || [];
  let u; try { u = new URL(url); } catch { return false; }
  return list.some(src => {
    if (src === "'self'") return u.origin === ORIGIN;
    if (src === 'data:') return u.protocol === 'data:';
    if (!/^https?:\/\//.test(src)) return false;
    const s = new URL(src);
    if (s.host.startsWith('*.') ? !u.host.endsWith(s.host.slice(1)) : s.host !== u.host) return false;
    if (s.pathname === '/' || s.pathname === '') return true;
    return s.pathname.endsWith('/') ? u.pathname.startsWith(s.pathname) : u.pathname === s.pathname;
  });
};

// ---- redirects (an internal link may land on a redirect rule instead of a file)
const redirects = (has.has('_redirects') ? readFileSync(join(site, '_redirects'), 'utf8') : '').split('\n')
  .map(l => l.trim()).filter(l => l && !l.startsWith('#')).map(l => l.split(/\s+/)[0]);
const redirected = p => redirects.some(r => r.endsWith('*') ? p.startsWith(r.slice(0, -1)) : (p === r || p === r + '/'));
const resolves = p => {
  if (p === '/' ) return has.has('index.html');
  const clean = decodeURIComponent(p.replace(/^\//, ''));
  if (clean.endsWith('/')) return has.has(clean + 'index.html') || redirected(p);
  return has.has(clean) || has.has(clean + '/index.html') || redirected(p);
};

// ---- pages
const pages = all.filter(f => f.endsWith('.html'));
const alt = {};   // page -> {en, fr}
const canonOf = {};
const TYPOS = ['Sing Up', 'Sing In', 'ressources', 'generosuty', 'Cordinator', ' teem ', 'La Fontaine Parc'];
for (const f of pages) {
  const raw = readFileSync(join(site, f), 'utf8');
  // Blank out what is not markup (comments and the contents of scripts) so the tag checks only see real tags.
  const text = raw.replace(/<!--[\s\S]*?-->/g, m => m.replace(/[^\n]/g, ' '))
    .replace(/(<script\b[^>]*>)([\s\S]*?)(<\/script>)/gi, (m, a, b, c) => a + b.replace(/[^\n]/g, ' ') + c);
  const tags = [...text.matchAll(/<([a-zA-Z][a-zA-Z0-9-]*)(\s[^>]*)?>/g)];
  const attrsOf = t => { const o = {}; for (const m of (t[2] || '').matchAll(/([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g)) o[m[1].toLowerCase()] = m[3] ?? m[4] ?? m[5] ?? ''; return o; };
  let h1 = 0, title = false, desc = false, canon = '', og = '', lang = '';
  for (const t of tags) {
    const name = t[1].toLowerCase(), line = lineOf(text, t.index), a = attrsOf(t);
    const bare = (t[2] || '').replace(/"[^"]*"|'[^']*'/g, '""');
    if (/\sstyle\s*=/i.test(bare)) fail(f, line, `Inline style attribute on <${name}>. The site's security policy blocks inline styles, so it would be ignored on the live site. Put the style in assets/site.css as a class.`);
    const ev = bare.match(/\s(on[a-z]+)\s*=/i);
    if (ev) fail(f, line, `Inline event handler ${ev[1]}= on <${name}>. The security policy blocks it, so it would never run. Do it from a script file in assets/ instead.`);
    for (const k of ['href', 'src', 'action']) if (a[k] && /^\s*javascript:/i.test(a[k])) fail(f, line, `A javascript: link on <${name}>. Blocked by the security policy; use a button and a script file.`);
    if (name === 'style') fail(f, line, 'A <style> block. The security policy blocks inline styles; move the rules into a stylesheet in assets/.');
    if (name === 'script' && !a.src && !/^application\/(ld\+)?json$/i.test(a.type || '')) fail(f, line, 'An inline <script>. The security policy blocks inline scripts, so it would never run. Put the code in a file in assets/ and load it with <script src=... defer>.');
    if (name === 'h1') h1++;
    if (name === 'title') title = true;
    if (name === 'html') lang = a.lang || '';
    if (name === 'meta' && a.name === 'description' && a.content) desc = true;
    if (name === 'meta' && a.property === 'og:url') og = a.content || '';
    if (name === 'link' && a.rel === 'canonical') canon = a.href || '';
    if (name === 'link' && a.rel === 'alternate' && a.hreflang && a.hreflang !== 'x-default') (alt[f] = alt[f] || {})[a.hreflang] = a.href;
    if (name === 'img' && !('alt' in a)) fail(f, line, '<img> without an alt attribute. Describe the photo in a few words (alt="Volunteers serving soup"), or alt="" if it is only decoration.');
    // Outside addresses must be allowed by the security policy, or the browser blocks them.
    const ext = [];
    if (name === 'script' && a.src) ext.push(['script-src', a.src]);
    if (name === 'link' && /stylesheet/.test(a.rel || '') && a.href) ext.push(['style-src', a.href]);
    if ((name === 'img' || name === 'source') && a.src) ext.push([name === 'source' && /video|audio/.test(a.type || '') ? 'media-src' : 'img-src', a.src]);
    if ((name === 'img' || name === 'source') && a.srcset) for (const s of a.srcset.split(',')) ext.push(['img-src', s.trim().split(/\s+/)[0]]);
    if (name === 'video' && a.poster) ext.push(['img-src', a.poster]);
    if ((name === 'video' || name === 'audio') && a.src) ext.push(['media-src', a.src]);
    if (name === 'iframe' && a.src) ext.push(['frame-src', a.src]);
    if (name === 'form' && a.action) ext.push(['form-action', a.action]);
    for (const [dir, url] of ext) {
      if (!/^https?:\/\//i.test(url) || url.startsWith(ORIGIN + '/')) continue;
      if (!allowed(dir, url)) fail(f, line, `${url} is not allowed by the security policy (${dir} in _headers), so browsers will block it. Use a file hosted on the site instead, or ask Steel to approve adding this address to _headers.`);
    }
    // Internal links and files must exist.
    for (const k of ['href', 'src', 'poster']) {
      let v = a[k]; if (!v) continue;
      if (v.startsWith(ORIGIN + '/') || v === ORIGIN) v = v.slice(ORIGIN.length) || '/';
      if (!v.startsWith('/') || v.startsWith('//')) continue;
      const p = v.split('#')[0].split('?')[0];
      if (p && !resolves(p)) fail(f, line, `Link to ${p}, which is not a file on the site or a redirect in _redirects. Fix the address, or add the page.`);
    }
  }
  if (h1 !== 1) fail(f, 0, `${h1} <h1> headings. Every page needs exactly one: its main title. Use <h2> and below for the rest.`);
  if (!title) fail(f, 0, 'No <title>. Every page needs one: it is what shows in search results and browser tabs.');
  if (!desc && f !== '404.html') fail(f, 0, 'No <meta name="description">. Add one sentence about the page for search results.');
  const wantLang = f.startsWith('fr/') ? 'fr' : 'en';
  if (lang !== wantLang) fail(f, 0, `<html lang="${lang}">, but pages ${wantLang === 'fr' ? 'under fr/' : 'outside fr/'} must say lang="${wantLang}".`);
  if (f !== '404.html') {
    const own = ORIGIN + '/' + f.replace(/index\.html$/, '');
    if (canon !== own) fail(f, 0, `The canonical link says ${canon || '(missing)'} but this page lives at ${own}. A copied page keeps its old address: update <link rel="canonical">, og:url and the hreflang links.`);
    if (og && og !== canon) fail(f, 0, `og:url (${og}) differs from the canonical link (${canon}). They must match.`);
    canonOf[own] = f;
  }
  // Writing rules
  const visible = raw.replace(/<script\b[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' ');
  if (raw.includes('\u2014')) fail(f, lineOf(raw, raw.indexOf('\u2014')), 'An em dash (\u2014). The house style uses none: use a comma, a colon or a full stop instead.');
  for (const t of TYPOS) {
    if (t === 'ressources' && f.startsWith('fr/')) continue;   // correct in French
    if (visible.includes(t)) fail(f, 0, `"${t.trim()}" is a known typo from the mockups. Check the spelling.`);
  }
}
// Both languages: each English page names its French twin and the twin names it back.
for (const [f, links] of Object.entries(alt)) {
  for (const [lng, url] of Object.entries(links)) {
    const target = canonOf[url];
    if (!target) { fail(f, 0, `Its ${lng} version (${url}) does not exist. Every page has an English and a French version; create the twin or fix the hreflang link.`); continue; }
    const back = (alt[target] || {})[f.startsWith('fr/') ? 'fr' : 'en'];
    const self = ORIGIN + '/' + f.replace(/index\.html$/, '');
    if (back !== self) fail(target, 0, `Its hreflang link should point back to ${self} (from ${f}). Keep the English and French twins pointing at each other.`);
  }
}

// ---- added: twins match, anchors exist, every photo width exists, no dashes, one font link, the right logo, headings in order
const src = {}, ids = {};
for (const f of pages) { src[f] = readFileSync(join(site, f), 'utf8').replace(/<script\b[\s\S]*?<\/script>|<!--[\s\S]*?-->/gi, ''); ids[f] = new Set([...src[f].matchAll(/\sid="([^"]+)"/g)].map(m => m[1])); }
const fileOf = p => p === '' ? null : p.endsWith('/') ? p.slice(1) + 'index.html' : p.slice(1);
const shape = f => JSON.stringify([[...ids[f]].filter(i => i !== 'langhint'), src[f].match(/<h[1-6]\b/g),
  [...src[f].matchAll(/<img\b[^>]*\ssrc="([^"]+)"/g)].map(m => m[1].replace(/logo-fr-(green|cream)\.png/, 'logo-$1.svg'))]);
const sentences = f => new Set(src[f].replace(/<head>[\s\S]*?<\/head>|<((?!html\b)\w+)[^>]*\slang="[^"]*"[^>]*>[\s\S]*?<\/\1>/g, ' ')
  .split(/<[^>]+>/).map(s => s.replace(/\s+/g, ' ').trim()).filter(s => s.split(' ').length >= 6));
const font = (src['index.html'].match(/href="(https:\/\/fonts\.googleapis\.com\/[^"]+)"/) || [])[1];
for (const f of pages) {
  const t = src[f], fr = f.startsWith('fr/');
  for (const m of t.matchAll(/\shref="([^"]*)#([^"]+)"/g)) {
    const page = m[1] === '' ? f : fileOf(m[1].replace(ORIGIN, ''));
    if (page && ids[page] && !ids[page].has(m[2]) && !ids[page].has(m[2].replace(/-form$/, '')))
      fail(f, lineOf(t, m.index), `Link to #${m[2]}, but ${page} has no id="${m[2]}". Keep ids as they are: other pages, emails and the sign-up pop-ups use them.`);
  }
  for (const m of t.matchAll(/\s(?:srcset|data-srcset|data-src|data-full)="([^"]+)"/g)) for (const c of m[1].split(','))
    { const u = c.trim().split(/\s+/)[0]; if (u.startsWith('/') && !resolves(u.split('?')[0])) fail(f, lineOf(t, m.index), `${u} is not a file on the site. Not every photo has all three widths: list only the files that exist in site/img/.`); }
  const d = t.match(/\u2014|\u2013|&[mn]dash;|&#821[12];|&#x201[34];/i);
  if (d) fail(f, lineOf(t, d.index), `A dash (${d[0]}). The house style uses none: use a comma, a colon or a full stop.`);
  for (const m of t.matchAll(/href="(https:\/\/fonts\.googleapis\.com\/[^"]+)"/g)) if (m[1] !== font) fail(f, lineOf(t, m.index), 'A different Google Fonts link. The brand uses only Barlow Condensed and Space Grotesk: keep the link the other pages use.');
  if (fr ? /\/assets\/logo-(green|cream)\.svg/.test(t) : /\/assets\/logo-fr-/.test(t)) fail(f, 0, `The ${fr ? 'English' : 'French'} logo on a ${fr ? 'French' : 'English'} page. French pages use logo-fr-green.png and logo-fr-cream.png.`);
  let prev = 0; for (const m of t.matchAll(/<h([1-6])\b/g)) { const lv = +m[1]; if (prev && lv > prev + 1) fail(f, lineOf(t, m.index), `<h${lv}> right after <h${prev}>. Headings go down one level at a time.`); prev = lv; }
}
for (const [f, links] of Object.entries(alt)) {
  const twin = canonOf[links.fr]; if (f.startsWith('fr/') || !twin) continue;
  if (shape(f) !== shape(twin)) fail(twin, 0, `It no longer matches ${f}: different sections (ids), headings or photos. Make the same change on both pages.`);
  const en = sentences(f); for (const s of sentences(twin)) if (en.has(s)) fail(twin, 0, `English text on the French page: "${s.slice(0, 60)}". Translate it, or mark a quote with lang="en".`);
}
for (const f of all.filter(p => p.endsWith('.css'))) { const c = readFileSync(join(site, f), 'utf8'); if (/@import|url\(\s*["']?(https?:)?\/\//i.test(c)) fail(f, 0, 'An @import or an outside address in a stylesheet. Fonts and images come from the site itself.'); }

// ---- cache stamps (tools/stamp.mjs sets them; this confirms nothing slipped)
for (const f of all.filter(p => /\.(html|css|js)$/.test(p))) {
  const text = readFileSync(join(site, f), 'utf8');
  for (const m of text.matchAll(/\/assets\/([A-Za-z0-9_.-]+)\?v=([0-9a-f]+)/g)) {
    const file = 'assets/' + m[1];
    if (!has.has(file)) fail(f, lineOf(text, m.index), `Links ${file}, which does not exist.`);
    // An out-of-date ?v= in a pull request is fine: the publish step sets it. After that step (--stamped) it must be right.
    else if (stamped && md8(file) !== m[2]) fail(f, lineOf(text, m.index), `The cache stamp for ${file} was not updated by tools/stamp.mjs.`);
  }
}
if (stamped && has.has('assets/forms.js') && has.has('assets/forms.css')) {
  const v = (readFileSync(join(site, 'assets/forms.js'), 'utf8').match(/CSS_V\s*=\s*'([0-9a-f]{8})'/) || [])[1];
  if (v && v !== md8('assets/forms.css')) fail('assets/forms.js', 0, 'CSS_V was not updated for assets/forms.css by tools/stamp.mjs.');
}

// ---- secrets: nothing private may ever sit in the site's files (they are public)
const SECRET = [
  [/sk_(live|test)_[0-9a-zA-Z]{10,}/, 'a Stripe secret key'], [/rk_live_[0-9a-zA-Z]{10,}/, 'a Stripe restricted key'],
  [/whsec_[0-9a-zA-Z]{10,}/, 'a webhook signing secret'], [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'a private key'],
  [/gh[pousr]_[0-9A-Za-z]{30,}|github_pat_[0-9A-Za-z_]{30,}/, 'a GitHub token'], [/AKIA[0-9A-Z]{16}/, 'an AWS key'],
  [/xox[abpr]-[0-9A-Za-z-]{10,}/, 'a Slack token'], [/nfp_[0-9A-Za-z]{20,}/, 'a Netlify token'], [/\bre_[0-9A-Za-z]{24,}/, 'a Resend key'],
  [/service_role/i, 'the words service_role (the database master key)'], [/AIza[0-9A-Za-z_-]{35}/, 'a Google API key'],
];
for (const f of all.filter(p => /\.(html|css|js|json|txt|xml|svg|md)$|^_/.test(p))) {
  const text = readFileSync(join(site, f), 'utf8');
  for (const [re, what] of SECRET) { const m = text.match(re); if (m) fail(f, lineOf(text, m.index), `This looks like ${what}. Never put keys or passwords in the site: remove it now and tell Steel, so the key can be changed.`); }
  for (const m of text.matchAll(/eyJ[A-Za-z0-9_-]{10,}\.(eyJ[A-Za-z0-9_-]{10,})\.[A-Za-z0-9_-]{10,}/g)) {
    let role = '?'; try { role = JSON.parse(Buffer.from(m[1], 'base64url').toString()).role; } catch { /* unreadable */ }
    if (role !== 'anon') fail(f, lineOf(text, m.index), `A sign-in token with role "${role}". Only the public anon key may appear in the site. Remove it and tell Steel.`);
  }
}

// ---- file sizes
for (const f of all) {
  const size = statSync(join(site, f)).size;
  if (size > 10 * 1024 * 1024) fail(f, 0, `${(size / 1048576).toFixed(1)} MB. Files over 10 MB do not belong in the site; compress it, or host the video elsewhere.`);
  else if (/\.(jpe?g|png|webp|gif)$/i.test(f) && size > 800 * 1024) warn(f, 0, `${Math.round(size / 1024)} KB. Large photos slow the site on phones; aim for under 400 KB (export at 1600 px wide, quality 80).`);
}

for (const w of warns) console.log(w);
for (const e of fails) console.log(e);
console.log(`\n${pages.length} pages and ${all.length} files checked: ${fails.length} problem${fails.length === 1 ? '' : 's'}, ${warns.length} warning${warns.length === 1 ? '' : 's'}.`);
process.exit(fails.length ? 1 : 0);
