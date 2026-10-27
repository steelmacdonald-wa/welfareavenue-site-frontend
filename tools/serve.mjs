// Welfare Avenue website: a small local server that behaves like Netlify for this site.
// It serves the site folder with the same headers (_headers, including the security policy) and redirects
// (_redirects), folder addresses ending in / load their index.html, and unknown addresses get 404.html.
// Usage: node tools/serve.mjs [site folder] [port]   then open http://localhost:8080
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function startServer(site = 'site', port = 8080) {
  const root = resolve(site);
  const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.webp': 'image/webp', '.gif': 'image/gif', '.mp4': 'video/mp4', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.ico': 'image/x-icon' };
  // _headers: blocks of "path pattern" then indented "Name: value" lines.
  const rules = [];
  if (existsSync(join(root, '_headers'))) {
    let cur = null;
    for (const line of readFileSync(join(root, '_headers'), 'utf8').split('\n')) {
      if (!line.trim() || line.trim().startsWith('#')) continue;
      if (!/^\s/.test(line)) { cur = { pattern: line.trim(), headers: [] }; rules.push(cur); continue; }
      const i = line.indexOf(':'); if (cur && i > 0) cur.headers.push([line.slice(0, i).trim(), line.slice(i + 1).trim()]);
    }
  }
  const matches = (pattern, path) => pattern.endsWith('*') ? path.startsWith(pattern.slice(0, -1)) : path === pattern;
  const redirects = existsSync(join(root, '_redirects')) ? readFileSync(join(root, '_redirects'), 'utf8').split('\n')
    .map(l => l.trim()).filter(l => l && !l.startsWith('#')).map(l => l.split(/\s+/)) : [];

  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    let path = decodeURIComponent(url.pathname);
    for (const [from, to, code] of redirects) {
      if (from.endsWith('*') ? path.startsWith(from.slice(0, -1)) : path === from || path === from + '/') {
        res.writeHead(Number(code) || 301, { Location: to }); return res.end();
      }
    }
    let file = join(root, path);
    if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
    if (existsSync(file) && statSync(file).isDirectory()) {
      if (!path.endsWith('/')) { res.writeHead(301, { Location: path + '/' + url.search }); return res.end(); }
      file = join(file, 'index.html');
    }
    let status = 200;
    if (!existsSync(file) || !statSync(file).isFile() || /(^|\/)_(headers|redirects)$/.test(path)) { file = join(root, '404.html'); status = 404; path = '/404.html'; }
    const head = { 'Content-Type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream' };
    for (const r of rules) if (matches(r.pattern, path)) for (const [k, v] of r.headers) head[k] = v;
    res.writeHead(status, head);
    res.end(readFileSync(file));
  });
  return new Promise(ok => server.listen(port, () => ok(server)));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const site = process.argv[2] || 'site', port = Number(process.argv[3]) || 8080;
  startServer(site, port).then(() => console.log(`Serving ${site} at http://localhost:${port} (Ctrl+C to stop)`));
}
