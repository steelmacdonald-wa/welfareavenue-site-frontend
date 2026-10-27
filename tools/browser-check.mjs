// Welfare Avenue website: the browser checks.
// Opens every page in a real browser at a computer width (1280 px) and a phone width (390 px), the way Netlify serves
// them (same headers and security policy), and fails on: a script error, anything the security policy blocks, a page
// that scrolls sideways on a phone, or a serious accessibility problem (axe-core, WCAG 2.1 A and AA).
// Outside services (the Hub, Google, YouTube) are not contacted: their requests are stopped, which the pages handle.
// Usage: npm ci && npx playwright install chromium && node tools/browser-check.mjs [site folder]
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { startServer } from './serve.mjs';

const site = process.argv[2] || 'site';
const PORT = 8123, BASE = `http://localhost:${PORT}`;
const walk = (d, out = []) => { for (const n of readdirSync(d)) { const p = join(d, n); statSync(p).isDirectory() ? walk(p, out) : out.push(p); } return out; };
const pages = walk(site).map(p => relative(site, p).split('\\').join('/')).filter(p => p.endsWith('.html') && p !== '404.html')
  .map(p => '/' + p.replace(/index\.html$/, '')).sort()
  .filter(p => !process.env.CHECK_PAGES || process.env.CHECK_PAGES.split(',').includes(p));   // e.g. CHECK_PAGES=/,/fr/
const WIDTHS = [[1280, 900], [390, 844]];
const NOISE = /Failed to load resource|net::ERR_|ERR_FAILED|ERR_BLOCKED|status of 4\d\d|Failed to fetch|NetworkError|Load failed|gsi|youtube|GSI_LOGGER/i;

const server = await startServer(site, PORT);
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const fails = [], warns = [];
for (const path of pages) {
  for (const [w, h] of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
    await ctx.route('**/*', r => r.request().url().startsWith(BASE) ? r.continue() : r.abort());
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push('script error: ' + e.message.split('\n')[0]));
    page.on('response', r => { if (r.url().startsWith(BASE) && r.status() >= 400) errors.push(`${r.status()} for ${r.url().slice(BASE.length)}: a file this page links to is missing`); });
    page.on('console', m => { if (m.type() === 'error' && !NOISE.test(m.text())) errors.push('console: ' + m.text().slice(0, 200)); });
    await page.addInitScript(() => { window.__csp = []; document.addEventListener('securitypolicyviolation', e => window.__csp.push(e.violatedDirective + ' ' + (e.blockedURI || 'inline'))); });
    const where = `${path} at ${w}px`;
    try {
      await page.goto(BASE + path, { waitUntil: 'load', timeout: 30000 });
      await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); } scrollTo(0, 0); });
      await page.waitForTimeout(400);
    } catch (e) { fails.push(`FAIL ${where}  did not load: ${e.message.split('\n')[0]}`); await ctx.close(); continue; }
    // On the live site the page's own address is https://welfareavenue.com, which the policy allows as 'self'.
    const csp = await page.evaluate(() => window.__csp.filter(v => !/ https:\/\/(www\.)?welfareavenue\.com(\/|$)/.test(v)));
    for (const v of csp) fails.push(`FAIL ${where}  blocked by the security policy: ${v}. Inline styles and scripts never run on the live site; move them into assets/.`);
    for (const e of errors) fails.push(`FAIL ${where}  ${e}`);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (over > 1) fails.push(`FAIL ${where}  the page scrolls sideways by ${over}px. Something is wider than the screen (a fixed width, a long word or a wide image); let it shrink.`);
    for (const b of await page.$$('.btn')) {   // hover states: axe only sees buttons at rest
      if (!(await b.isVisible())) continue;
      await b.hover({ force: true }).catch(() => {}); await page.waitForTimeout(200);
      const r = await b.evaluate(e => { const s = getComputedStyle(e), L = c => { const v = c.match(/[\d.]+/g).map(Number); if (v.length > 3 && v[3] < 1) return null; return v.slice(0, 3).map(x => (x /= 255) <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4).reduce((a, x, i) => a + x * [.2126, .7152, .0722][i], 0); };
        const a = L(s.color), b = L(s.backgroundColor); return a === null || b === null ? null : [(Math.max(a, b) + .05) / (Math.min(a, b) + .05), e.textContent.trim().slice(0, 30)]; });
      if (r && r[0] < 4.5) fails.push(`FAIL ${where}  the button "${r[1]}" has text contrast ${r[0].toFixed(1)}:1 on hover (needs 4.5:1).`);
    }
    if (w === 1280 || w === 390) {
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      for (const v of axe.violations) {
        const msg = `${where}  accessibility (${v.impact}): ${v.help}. ${v.nodes.length} place${v.nodes.length === 1 ? '' : 's'}, e.g. ${v.nodes[0].target.join(' ')}. ${v.helpUrl}`;
        (v.impact === 'serious' || v.impact === 'critical' ? fails : warns).push((v.impact === 'serious' || v.impact === 'critical' ? 'FAIL ' : 'WARN ') + msg);
      }
    }
    await ctx.close();
  }
}
await browser.close(); server.close();
for (const x of warns) console.log(x);
for (const x of fails) console.log(x);
console.log(`\n${pages.length} pages at ${WIDTHS.length} widths: ${fails.length} problem${fails.length === 1 ? '' : 's'}, ${warns.length} warning${warns.length === 1 ? '' : 's'}.`);
process.exit(fails.length ? 1 : 0);
