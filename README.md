# welfareavenue.com

The public website of Welfare Avenue (Avenue du Bien-Être), in English and French. Everything that is published lives in `site/`.

## Changing the site

Read [AGENTS.md](AGENTS.md) first. It is the brief for people and AI tools alike: how the site is built, what is wired to the Hub, the rules that cannot be broken and the steps for every change.

In short: make a branch, change the page in both languages, open a pull request, check the preview link Netlify adds to it, and wait for approval. Merging publishes to welfareavenue.com.

## The checks

Every pull request runs the Site checks: the security policy, both languages, links, cache stamps, accessibility, phone widths and a scan for keys that must never be in the site. You can run the quick ones yourself with Node 20 or newer, with nothing to install:

```
node tools/check.mjs site     # the house rules
node tools/serve.mjs          # the site at http://localhost:8080, served the way Netlify serves it
```

Never run `tools/stamp.mjs` yourself or commit `?v=` changes: the publish step sets the cache stamps.

The browser checks need Playwright: `npm ci --prefix tools`, `npx --prefix tools playwright install chromium`, then `node tools/browser-check.mjs site`.

## Publishing

Netlify publishes `site/` from `main` (see `netlify.toml`). Before each publish it sets the cache stamps and runs the house-rule checks; if a check fails, nothing is published. Pull requests get a free preview link; each publish uses Welfare Avenue's Netlify credits, so group changes into one pull request per round.

Questions go to Steel MacDonald.
