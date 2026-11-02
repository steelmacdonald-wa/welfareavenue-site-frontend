# Gift drive, Get involved menu, scroll stories and SEO: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put the Holiday Gift Basket Drive on the home page and in a renamed "Get involved" menu, make four stories move as the visitor scrolls, and tune the home and drive pages for search, in English and French, in one pull request.

**Architecture:** Static HTML pages edited in place; one shared reveal module appended to `site/assets/site.js` with its rules at the end of `site/assets/site.css`; drive-only chapter logic in `site/assets/drive.js` and `drive.css`. Header and footer edits are applied to all 29 pages by a one-off Node script run from the scratchpad (not committed), so every page gets the identical markup.

**Tech Stack:** HTML, CSS (custom properties, `@supports (animation-timeline: view())`), vanilla JavaScript (IntersectionObserver), Node 20+ for `tools/check.mjs` and `tools/serve.mjs`, the built-in browser for visual checks.

**Spec:** `docs/superpowers/specs/2026-11-02-gift-drive-story-design.md`

## Global Constraints

- No inline `style=`, `<style>`, inline `<script>` (JSON-LD excepted), `on...=`; all CSS in `assets/*.css`, all JS in `assets/*.js` loaded with `defer`.
- Never edit a `?v=` stamp; never run `tools/stamp.mjs`.
- Every EN change has its FR twin in the same commit; twins must keep identical ids, heading sequence and `<img src>` order (`tools/check.mjs` compares them); no English sentence of 6+ words on a French page.
- Never rename, remove or translate an `id`, a `data-` attribute or its value. Hub-wired elements (`data-wa-form`, `data-wa-popup*`, `data-wa-donate`, `data-wa-campaign`, `data-upcoming`, `data-campaign`, `data-dr*`, `data-acct-link`, `data-signup`) are copied verbatim.
- Colours only via the variables in `:root`; headings Barlow Condensed sentence case; Canadian spelling; no em or en dashes anywhere in HTML (checks fail).
- Only `transform`, `opacity` (and `clip-path`) animate; strong ease-out `cubic-bezier(.23,1,.32,1)`; reveal 600 ms, stagger 60 ms, count-up 900 ms; reduced motion keeps everything visible.
- Photos: only files that exist in `site/img/` at the widths listed there. `2025-12-gift-baskets-the-crew` and `-delivery` have 480, 960, 1600; `-wrapping`, `-bags`, `-elf-hat` have 480 and 960 only.
- Facts only from the site (see the spec's constraints list). No wrapping-event date. No One Bag Challenge.
- Branch `claude/gift-drive-story`; one PR into `main`; never merge.

## Review Focus

1. JavaScript disabled or `IntersectionObserver` missing: every band, tile and chapter must be fully visible with nothing moved. Pinned in Task 1 (the `rv` class is only ever added by the script; CSS hides nothing without it).
2. `prefers-reduced-motion: reduce`: content visible, counts show their final number at once, chapter photos switch without motion. Pinned in Task 1 and Task 4.
3. A visitor arriving mid-page (a `#faq` or `#timeline` link, or a reload at scroll depth): elements already in or above the viewport must not flash from hidden. Pinned in Task 1 (anything whose top is above `innerHeight` at run time gets `is-in` immediately).
4. A phone at 390 px: the drive band's buttons stack, the chapter photos stack above their text, nothing scrolls sideways. Pinned in Task 3 and Task 4.
5. Hub data arriving late (campaign totals, next servings, team photos): must never be inside a `rv` element. Pinned in Task 1 (skip list) and Task 4.

---

### Task 1: Motion foundation (tokens, reveal module, count-up, press feedback)

**Files:**
- Modify: `site/assets/site.css` (`:root` on line 7; end of the "Buttons" group after line 75; new group appended at the end)
- Modify: `site/assets/site.js` (append a new IIFE at the end)

**Interfaces:**
- Produces: CSS classes `rv` (hidden until `is-in`), `rv-group` (parent whose children stagger), custom property `--rv-i`; attribute `data-count` on a `<b>`/`<p>` whose text is a number like `14,000+` or `6 000`; attribute `data-rv="off"` on any ancestor to opt out; token `--ease-out`.
- Produces for Task 4: nothing (drive.js has its own chapter observer) but it reuses `.rv`.

- [ ] **Step 1: Add tokens and press feedback in `site.css`**

In `:root` add `--ease-out:cubic-bezier(.23,1,.32,1);--ease-in-out:cubic-bezier(.77,0,.175,1)`. After the `.btn:hover` rule add `.btn,.sq{transition:background .15s,color .15s,border-color .15s,transform .16s var(--ease-out)} .btn:active,.sq:active{transform:scale(.97)}` (keep the existing transition list; add transform to it rather than a second `transition` declaration).

- [ ] **Step 2: Append the reveal group to `site.css`**

```css
/* wave274 (02/11/26, Steel: "make our story feel immersive as the user scrolls"): the scroll reveal. site.js adds .rv to
   parts of a page below the first screen and .is-in when they scroll into view; without JavaScript nothing is hidden. */
.rv{opacity:0;transform:translateY(14px);transition:opacity .6s var(--ease-out),transform .6s var(--ease-out);transition-delay:calc(var(--rv-i,0) * 60ms)}
.rv.is-in{opacity:1;transform:none}
@media (prefers-reduced-motion:reduce){.rv{opacity:1;transform:none}}
```

- [ ] **Step 3: Append the reveal module to `site.js`**

An IIFE, same comment style as the others, that:
1. Returns if `!('IntersectionObserver' in window)`.
2. `RM = matchMedia('(prefers-reduced-motion: reduce)').matches`.
3. Collects targets with `document.querySelectorAll(SEL)` where `SEL = '.band .split > *, .paths li, .tiles .tile, .pillars li, .focus > div, .ways .way, .steps li, .needs li, .timeline li, .drt li, .gtags .gt, .cards2 .card, .quote, .gallery > *, .posters li, .dgrow li, .faq-list > *'`.
4. Skips a target if `el.closest('.hero, [data-upcoming], [data-campaign], [data-dr-gifts], [data-wa-form], .form-card, [data-rv="off"], .foot')` is truthy, or if it contains any of `[data-upcoming], [data-campaign], [data-wa-form]`.
5. For each kept target: `--rv-i` = its index among kept siblings of the same parent, capped at 6, set with `el.style.setProperty('--rv-i', i)` (allowed: it is a script-set inline property, not a `style=` attribute in HTML; CSP `style-src` governs attributes and `<style>` tags, and site.js already sets `style.transform` on the hero bar); add class `rv`. If `el.getBoundingClientRect().top < window.innerHeight` at that moment, add `is-in` at once.
6. One `IntersectionObserver` with `{threshold:.15, rootMargin:'0px 0px -10% 0px'}`; on intersect add `is-in`, unobserve.
7. Count-up: for each `[data-count]` (skipped under RM): parse digits from `textContent` (strip spaces, commas, non-breaking spaces; keep a trailing `+` as `suffix`), target `N`. When its nearest `.rv` ancestor or itself gets `is-in` (observe the element itself with the same observer options), animate 900 ms with `requestAnimationFrame`, value `Math.round(N * e)` where `e = 1 - Math.pow(1 - t, 3)`, formatted with `toLocaleString(document.documentElement.lang === 'fr' ? 'fr-CA' : 'en-CA')` plus suffix, and write the exact original text at the end.

- [ ] **Step 4: Mark the home tiles for counting (EN + FR)**

In `site/index.html` and `site/fr/index.html`, inside `.tiles`, each `<b>14,000+</b>` style element becomes `<b data-count>14,000+</b>` (four tiles). The French tiles use `14 000+` with a non-breaking space; the parser in Step 3 must strip ` `.

- [ ] **Step 5: Run the house checks**

Run: `node tools/check.mjs site`
Expected: no `FAIL` lines.

- [ ] **Step 6: Look at it**

Run `node tools/serve.mjs` in the background, open `http://localhost:8080/` in the built-in browser at desktop width: scroll; the paths cards and tiles fade up in sequence; tiles count. Reload at mid-page: no flash. Emulate reduced motion in the browser pane (colorScheme is not it; use DevTools' rendering emulation via `javascript_tool` is not possible, so instead temporarily add `rv` handling check: everything visible when `matchMedia` reports reduce. If emulation is unavailable, read the CSS rule and move on.)

- [ ] **Step 7: Commit**

```bash
git add site/assets/site.css site/assets/site.js site/index.html site/fr/index.html docs/
git commit -m "Scroll reveal, count-up and press feedback (wave274)"
```

### Task 2: "Get involved" menu and footer link on all 29 pages

**Files:**
- Modify: every `site/**/index.html` (28) and `site/404.html` (header `nav` and footer "Explore"/"Explorer" lists)
- Scratch (not committed): a Node script in the scratchpad that applies exact string replacements and fails loudly if a page misses a match.

**Interfaces:**
- Consumes nothing. Produces the final header markup Task 3 must preserve when it edits `index.html`.

- [ ] **Step 1: Write the replacement script**

In the scratchpad, `nav.mjs` that, for each page:

EN pages (not under `fr/`): replace
- `<a class="dd-top" href="/volunteer/">Volunteer</a>` → `<a class="dd-top" href="/volunteer/">Get involved</a>`
- `<span class="sr">More ways to volunteer</span>` → `<span class="sr">More ways to get involved</span>`
- `<div class="dd-menu" id="dd-vol">` → `<div class="dd-menu" id="dd-vol">` + the drive item: `<a href="/gift-basket-drive/"><svg class="dd-ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><rect x="3.5" y="8.5" width="17" height="4"/><path d="M5 12.5v8h14v-8M12 8.5v12"/><path d="M12 8.5C10.5 5 6.5 4.3 6.5 6.9c0 1.6 3 1.6 5.5 1.6zM12 8.5c1.5-3.5 5.5-4.2 5.5-1.6 0 1.6-3 1.6-5.5 1.6z"/></g></svg><span><b>Holiday Gift Basket Drive</b><small>December 2026 · Aim: 6,000 gifts</small></span></a>`
- `<li><a href="/volunteer/#groups">Volunteer as a group</a></li>` → itself + `<li><a href="/gift-basket-drive/">Holiday Gift Basket Drive</a></li>`

FR pages: the same four with `/fr/benevolat/` + `Bénévolat` → `S’impliquer` (curly apostrophe, as the site uses), `Autres façons de faire du bénévolat` → `Plus de façons de s’impliquer`, drive item href `/fr/paniers-cadeaux/`, `<b>Collecte de paniers-cadeaux</b><small>Décembre 2026 · Objectif : 6 000 cadeaux</small>` (non-breaking spaces before `:` and in `6 000`, written as `&nbsp;`), footer `<li><a href="/fr/benevolat/#groups">Bénévolat en groupe</a></li>` + `<li><a href="/fr/paniers-cadeaux/">Collecte de paniers-cadeaux</a></li>`.

On the drive pages themselves, add `aria-current="page"` to the new menu item (`/gift-basket-drive/` and `/fr/paniers-cadeaux/` only), matching how `Home` carries it.

The script counts replacements per file and exits non-zero if any page gets fewer than 4.

- [ ] **Step 2: Run it, then the checks**

Run: `node <scratchpad>/nav.mjs` then `node tools/check.mjs site` and `git diff --stat`
Expected: 29 files changed; no FAIL.

- [ ] **Step 3: Look at it**

Desktop: hover "Get involved" on `/` and `/fr/`: the drive is first with the gift icon. Phone (390 px): the menu lists the drive under "Get involved". Footer shows the drive link.

- [ ] **Step 4: Commit**

```bash
git add site
git commit -m "Get involved menu with the gift basket drive first, footer link, 29 pages"
```

### Task 3: The drive on the home page (band and hero slide), EN + FR

**Files:**
- Modify: `site/index.html` (line 46 hero, insert a band after line 47), `site/fr/index.html` (same two places; the FR paths section and hero are on their own lines, find by `class="paths"` and `data-hs`)
- Modify: `site/assets/site.css` (append a "drive band" group)

**Interfaces:**
- Produces: `.drive-band`, `.dgrow` (growth bars) also used by Task 4 on the drive page.

- [ ] **Step 1: Insert the band after `</section>` of `.paths`**

EN markup:

```html
<section class="band on-cream drive-band" id="gift-basket-drive"><div class="wrap split"><div><p class="over">Holiday Gift Basket Drive · December 2026 · Montreal</p><h2>This December, 6,000 gifts, hand-delivered</h2><p class="mt1">Every December, our volunteers fill, wrap and hand-deliver holiday gifts across Montreal. Cozy socks, warm hats, toys and care packages go to guests at Montreal shelters and to young patients in hospital.</p><ol class="dgrow" aria-label="Gifts hand-delivered each year"><li class="dg-25"><span class="dg-y">2024</span><span class="dg-bar"><i></i></span><span class="dg-n">1,500+ gifts</span></li><li class="dg-50"><span class="dg-y">2025</span><span class="dg-bar"><i></i></span><span class="dg-n">3,000+ gifts</span></li><li class="dg-100 dg-goal"><span class="dg-y">2026</span><span class="dg-bar"><i></i></span><span class="dg-n">6,000, our goal</span></li></ol><div class="btns"><a class="btn" href="https://hub.welfareavenue.com/give/?c=gift-basket-drive" data-wa-donate data-wa-campaign="gift-basket-drive">Give to the drive<svg class="ar" ...></svg></a><a class="btn ghost" href="/gift-basket-drive/#give-items">Donate gifts and essentials</a><a class="btn ghost" href="/gift-basket-drive/#wrap-with-us">Wrap with us</a></div><p class="fine mt2"><a class="textlink" href="/gift-basket-drive/#sponsors">Companies, schools and groups: see how to take part<svg class="ar" ...></svg></a></p></div><div class="pic"><img src="/img/2025-12-gift-baskets-wrapping-960.jpg" srcset="/img/2025-12-gift-baskets-wrapping-480.jpg 480w, /img/2025-12-gift-baskets-wrapping-960.jpg 960w" sizes="(min-width: 900px) 50vw, 100vw" width="960" height="1280" alt="Volunteers sit on the floor wrapping gifts beside tall windows and stacks of boxes." loading="lazy" decoding="async"></div></div></section>
```

The arrow SVG is the one every `.btn` on the page uses (copy it). The EN alt text is the gallery's `data-alt` for that photo on the EN drive page (read it from `site/gift-basket-drive/index.html` line 54). FR: `La collecte de paniers-cadeaux des Fêtes · Décembre 2026 · Montréal`; h2 `En décembre, 6 000 cadeaux livrés en main propre`; paragraph from the FR drive page's `#about` first two sentences; years the same; `1 500+ cadeaux`, `3 000+ cadeaux`, `6 000, notre objectif`; buttons `Donner à la collecte` (href with `&amp;lang=fr`, copied from the FR drive page), `Donner des cadeaux et des articles` → `/fr/paniers-cadeaux/#give-items`, `Emballer avec nous` → `/fr/paniers-cadeaux/#wrap-with-us`; text link `Entreprises, écoles et groupes : voyez comment participer` → `/fr/paniers-cadeaux/#sponsors`; alt from the FR gallery. All `6 000`-style numbers use `&nbsp;`.

- [ ] **Step 2: Add the first hero slide (EN + FR)**

In the `.bg` list, before the current first slide, insert `<div class="hs-slide is-on"><img src="/img/2025-12-gift-baskets-the-crew-960.jpg" srcset="...-480.jpg 480w, ...-960.jpg 960w, ...-1600.jpg 1600w" sizes="100vw" width="1600" height="1200" alt="About twenty volunteers hold up wrapped gifts behind tables in a bright room with city windows." fetchpriority="high"></div>`; the old first slide loses `is-on` and `fetchpriority="high"`, gains `aria-hidden="true"`, and its `src`/`srcset` become `data-src`/`data-srcset` with `decoding="async"` (as the other lazy slides). In `.hs-panes`, insert a new first pane `id="hs-p0"` with class `is-on`, tag icon = the gift SVG from Task 2, `<span>This December</span>`, line `Help us wrap and hand-deliver 6,000 holiday gifts across Montreal.`, button `See the gift basket drive` → `/gift-basket-drive/`; renumber the existing panes `hs-p0..hs-p5` → `hs-p1..hs-p6` and remove `is-on` from the old first pane. In `.hs-tabs`, insert a first tab `data-go="0" aria-controls="hs-p0" aria-current="true" class="hs-tab is-on"` with label `Gift drive`, and renumber the others (`data-go` 1..6, `aria-controls` hs-p1..hs-p6, remove `is-on`/`aria-current` from the old first). `hs-count` becomes `<b>01</b>/07`. FR: tag `Ce décembre`, line `Aidez-nous à emballer et à livrer 6 000 cadeaux des Fêtes partout à Montréal.`, button `Voir la collecte de paniers-cadeaux`, tab `Collecte`, alt from the FR gallery.

- [ ] **Step 3: Link the pillar and the About timeline entry (EN + FR)**

Home pillar: `Our Holiday Gift Basket Drive hand-delivered` → `Our <a href="/gift-basket-drive/">Holiday Gift Basket Drive</a> hand-delivered` (FR: find the same sentence in the FR pillar and wrap `collecte de paniers-cadeaux des Fêtes`). About `#story`: wrap `Holiday Gift Basket Drive` in the December 2025 entry the same way (FR: `collecte de paniers-cadeaux des fêtes`).

- [ ] **Step 4: Append the band CSS**

```css
/* wave274: the gift basket drive on the home page, and the growth bars shared with the drive page */
.drive-band .pic img{aspect-ratio:3/4}
.dgrow{list-style:none;margin:28px 0 0;padding:0;display:grid;gap:10px;max-width:34em}
.dgrow li{display:grid;grid-template-columns:3.2em 1fr;grid-template-rows:auto auto;column-gap:14px;align-items:center}
.dg-y{font-family:var(--hf);font-weight:600;font-size:20px;color:var(--green);grid-row:1 / span 2}
.dg-bar{display:block;height:14px;background:rgba(16,63,57,.1);overflow:hidden}
.dg-bar i{display:block;height:100%;background:var(--gold);transform-origin:left;transform:scaleX(1);transition:transform .9s var(--ease-out)}
.dg-25 .dg-bar{width:25%}.dg-50 .dg-bar{width:50%}.dg-100 .dg-bar{width:100%}
.dg-goal .dg-bar{background:none;border:1.5px solid var(--green)}.dg-goal .dg-bar i{background:var(--green);opacity:.18}
.dg-n{font-size:15px;color:var(--muted);margin-top:4px}
.dgrow li.rv:not(.is-in) .dg-bar i{transform:scaleX(0)}
@supports (animation-timeline: view()){.dgrow .dg-bar i{animation:dg-fill linear both;animation-timeline:view();animation-range:entry 20% entry 90%}
  @keyframes dg-fill{from{transform:scaleX(0)}to{transform:scaleX(1)}}
  .dgrow li.rv:not(.is-in) .dg-bar i{transform:none}}
@media (prefers-reduced-motion:reduce){.dgrow .dg-bar i{animation:none;transform:none}}
```

(`width` on `.dg-bar` is static per class, never animated; only the inner `i` transforms.)

- [ ] **Step 5: Checks and look**

Run: `node tools/check.mjs site`. Expected: no FAIL (twins: the new section id, h2 and img appear in the same order on `/fr/`). Browser at 1280 px and 390 px: hero shows the drive slide first with 7 tabs; the band sits after the three ways in; bars grow on scroll; buttons stack on the phone; nothing scrolls sideways (`document.documentElement.scrollWidth <= innerWidth` via `javascript_tool`).

- [ ] **Step 6: Commit**

```bash
git add site/index.html site/fr/index.html site/about/index.html site/fr/a-propos/index.html site/assets/site.css
git commit -m "Home: gift basket drive band, hero slide and links"
```

### Task 4: The drive page story, growth bars and FAQ, EN + FR

**Files:**
- Modify: `site/gift-basket-drive/index.html` (lines 48, 52; insert FAQ before line 54 `#photos`), `site/fr/paniers-cadeaux/index.html` (same sections, find by id)
- Modify: `site/assets/drive.css` (append), `site/assets/drive.js` (append a chapter IIFE)

**Interfaces:**
- Consumes `.rv`/`is-in` from Task 1 and `.dgrow` from Task 3.
- Produces: `#faq` section with `details.more` items; `.drt` wrapped in `.dr-story` with `.dr-photos`.

- [ ] **Step 1: Growth bars in `#progress`**

Inside `.drp-goal`, after `<p class="fine">Last year: more than 3,000 gifts...</p>`, insert the same `<ol class="dgrow" ...>` as Task 3 (EN and FR texts as there). Nothing inside `[data-dr-gifts]` or `[data-campaign]` changes.

- [ ] **Step 2: Chapters in `#timeline`**

Replace `<ol class="drt mt2">...</ol>` with:

```html
<div class="dr-story mt2"><ol class="drt">
<li class="is-on"><h3>Mid to end of November</h3><p>Donations of gifts, essentials and funds come in.</p><img class="dr-ph-m" src="/img/2025-12-gift-baskets-bags-960.jpg" srcset="...-480.jpg 480w, ...-960.jpg 960w" sizes="(min-width: 900px) 40vw, 100vw" width="960" height="1707" alt="[EN gallery alt for bags]" loading="lazy" decoding="async"></li>
<li><h3>December</h3><p>Our gift-wrapping event, over one or two weekends. Dates are coming soon.</p><img class="dr-ph-m" src="/img/2025-12-gift-baskets-wrapping-960.jpg" ... alt="[wrapping alt]"></li>
<li><h3>Before the holidays</h3><p>Volunteers hand-deliver the gifts across Montreal.</p><img class="dr-ph-m" src="/img/2025-12-gift-baskets-delivery-960.jpg" srcset="...-480.jpg 480w, ...-960.jpg 960w, ...-1600.jpg 1600w" ... width="1600" height="1204" alt="[delivery alt]"></li>
</ol><div class="dr-photos" aria-hidden="true"><div class="dr-ph is-on"><img src="...bags-960.jpg" srcset="..." sizes="40vw" width="960" height="1707" alt="" loading="lazy" decoding="async"></div><div class="dr-ph"><img ...wrapping... alt=""></div><div class="dr-ph"><img ...delivery... alt=""></div></div></div>
```

The six `<img src>` values appear in the same order on both twins (the shape check compares `src` order, not alt). Alts come from each page's own gallery `data-alt`. Headings stay `h3` and the `id="timeline"` stays on the section.

- [ ] **Step 3: FAQ section before `#photos`**

```html
<section class="band on-white" id="faq"><div class="wrap"><h2>Questions about the drive</h2><div class="faq-list mt2">
<details class="more"><summary>What can I donate?</summary><div class="in"><p>Clothing can be gently used. Hygiene essentials and toys must be brand new, so every gift feels like a gift.</p></div></details>
<details class="more"><summary>When do you collect donations?</summary><div class="in"><p>We collect gifts, essentials and funds from mid-November to the end of November. Our gift-wrapping event follows in December, over one or two weekends; dates are coming soon.</p></div></details>
<details class="more"><summary>Where do the gifts go?</summary><div class="in"><p>Our volunteers wrap everything and hand-deliver it before the holidays to guests at Montreal shelters and to young patients in hospital.</p></div></details>
<details class="more"><summary>How can I volunteer?</summary><div class="in"><p>Join our gift-wrapping event in December. <a href="#wrap-with-us">Sign up to help</a> and we will send you the dates as soon as they are set.</p></div></details>
<details class="more"><summary>Can my company, school or group help?</summary><div class="in"><p>Yes. Businesses donate products or wrapping supplies, or bring their team to wrap with us; schools and groups collect donations or wrap gifts. <a href="#sponsors">Write to us</a> and we will find the right fit.</p></div></details>
</div></div></section>
```

FR: same five, translated in Quebec French (summary and answers), the two links `#wrap-with-us` and `#sponsors`. The `FAQPage` JSON-LD in Task 6 copies these strings exactly.

- [ ] **Step 4: Append to `drive.css`**

```css
/* wave274 (02/11/26): the season as three chapters with a photo that changes as you scroll (desktop), a gold rail that fills,
   and the FAQ. Phones stack a photo above each chapter. */
.dr-story{position:relative}
.drt{position:relative}
.dr-ph-m{width:100%;aspect-ratio:4/3;object-fit:cover;margin-top:18px;display:block}
.dr-photos{display:none}
@media (min-width:900px){
  .dr-story{display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:start}
  .dr-story .drt{grid-template-columns:1fr;gap:0;padding-left:28px}
  .dr-story .drt::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:rgba(16,63,57,.12)}
  .dr-story .drt::after{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--gold);transform-origin:top;transform:scaleY(var(--dr-fill,0));transition:transform .6s var(--ease-out)}
  .dr-story .drt li{min-height:55vh;border-top:0;padding-top:0;opacity:.45;transition:opacity .6s var(--ease-out)}
  .dr-story .drt li.is-on{opacity:1}
  .dr-ph-m{display:none}
  .dr-photos{display:block;position:sticky;top:96px;aspect-ratio:4/3;overflow:hidden}
  .dr-ph{position:absolute;inset:0;opacity:0;transform:scale(1.03);transition:opacity .6s var(--ease-out),transform .6s var(--ease-out)}
  .dr-ph.is-on{opacity:1;transform:none}
  .dr-ph img{width:100%;height:100%;object-fit:cover;display:block}
  @supports (animation-timeline: view()){.dr-story .drt::after{animation:dr-rail linear both;animation-timeline:view();animation-range:entry 30% exit 70%;transform:none;transition:none}
    @keyframes dr-rail{from{transform:scaleY(0)}to{transform:scaleY(1)}}}
}
.faq-list{display:grid;gap:0;max-width:820px}
.faq-list details.more{margin-top:0;border-top:0}
.faq-list details.more:first-child{border-top:1px solid var(--line)}
.faq-list details.more>.in p{margin:0}
@media (prefers-reduced-motion:reduce){.dr-ph{transform:none}.dr-story .drt::after{animation:none}}
```

Under reduced motion the global rule already removes transitions; `.dr-ph.is-on` still toggles opacity, which is a cut, acceptable.

- [ ] **Step 5: Append the chapter IIFE to `drive.js`**

Outside the existing campaign IIFE (which returns early without a campaign box), add an IIFE that: finds `.dr-story`; returns without `IntersectionObserver`; observes each `.drt li` with `{rootMargin:'-45% 0px -45% 0px', threshold:0}` (the band through the middle of the viewport); on intersect, sets `is-on` on that li and on `.dr-ph` of the same index, removes it from the others, and sets `--dr-fill` on `.drt` to `(index + 1) / count` via `style.setProperty` (used only where `view()` is unsupported; harmless otherwise). Chapter 1 starts `is-on` from the markup.

- [ ] **Step 6: Checks and look**

Run: `node tools/check.mjs site`. Expected: no FAIL (same ids, headings, img order on both twins; `#faq` on both). Browser 1280 px: scrolling `#timeline` swaps the sticky photo three times and fills the rail; 390 px: photos above each chapter, FAQ opens and closes; `#progress` bars grow; the money card is untouched.

- [ ] **Step 7: Commit**

```bash
git add site/gift-basket-drive/index.html site/fr/paniers-cadeaux/index.html site/assets/drive.css site/assets/drive.js
git commit -m "Drive page: three-chapter season story, growth bars and FAQ"
```

### Task 5: About timeline rail and volunteer "How to join" sequence

**Files:**
- Modify: `site/assets/site.css` (the "Timeline" group lines 258-263 and the "Numbered steps" group lines 185-192, plus additions appended to the wave274 group)
- No HTML change (both twins already share the markup; the reveal module tags `.timeline li` and `.steps li`).

- [ ] **Step 1: Timeline rail**

Change `.timeline{border-left:1px solid var(--rule)}` to keep the rule as a `::before` and add a gold `::after` that fills: `.timeline{position:relative;border-left:0} .timeline::before,.timeline::after{content:"";position:absolute;left:0;top:0;bottom:0;width:1px;background:var(--rule)} .timeline::after{width:3px;left:-1px;background:var(--gold);transform-origin:top;transform:scaleY(0)}` and inside `@supports (animation-timeline: view())` give `::after` `animation:dr-rail linear both;animation-timeline:view();animation-range:entry 25% exit 75%` (reuse the keyframes name by defining `@keyframes tl-rail` in site.css, since drive.css is not loaded on About). Without support, `::after` stays at `scaleY(0)` and the thin rule remains: acceptable. Gold squares: `.timeline li.rv .when::before`… simpler: `.timeline li.rv:not(.is-in)::before{transform:scale(.6)} .timeline li::before{transition:transform .6s var(--ease-out)}`.

- [ ] **Step 2: Join steps**

`.steps li.rv{transition-delay:calc(var(--rv-i,0) * 120ms)}` (the one 120 ms stagger). A connecting line on desktop: `@media (min-width:860px){.steps{position:relative}.steps::before{content:"";position:absolute;left:0;right:0;top:0;height:1px;background:var(--gold);transform-origin:left;transform:scaleX(0);transition:transform 1.2s var(--ease-out)} .steps.rv-in::before{transform:none}}`; the reveal module adds `rv-in` to a `.steps` parent when its first child gets `is-in` (one extra line in Task 1's module: on `is-in`, `el.parentElement.classList.add('rv-in')`).

- [ ] **Step 3: Checks, look, commit**

Run: `node tools/check.mjs site`; open `/about/#story` and `/volunteer/` at 1280 px and 390 px.

```bash
git add site/assets/site.css site/assets/site.js
git commit -m "About timeline rail and How to join sequence on scroll"
```

### Task 6: SEO on the home and drive pages, both languages

**Files:**
- Modify: `<head>` of `site/index.html`, `site/fr/index.html`, `site/gift-basket-drive/index.html`, `site/fr/paniers-cadeaux/index.html`; `site/sitemap.xml`.

- [ ] **Step 1: Titles and descriptions**

EN drive: `<title>Holiday Gift Basket Drive 2026, Montreal · Welfare Avenue</title>`, description `Give, donate gifts and essentials, or wrap with us: Welfare Avenue’s Holiday Gift Basket Drive hand-delivers 6,000 gifts to Montreal shelters and young patients in hospital this December.`; `og:title`/`og:description` identical. FR drive: `Collecte de paniers-cadeaux des Fêtes 2026, Montréal · Welfare Avenue` and a matching French description under 160 characters. EN home title: `Welfare Avenue · Youth-powered charity against food insecurity in Montreal and Toronto`; description: existing sentence + ` Volunteer, donate or find a free Sunday meal.` FR home: the equivalent.

- [ ] **Step 2: Robots, image alt, preload**

On all four: `<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">` after the description; `<meta property="og:image:alt" content="...">` (the hero photo's alt). Drive pages: `<link rel="preload" as="image" href="/img/2025-12-gift-baskets-the-crew-960.jpg" imagesrcset="/img/2025-12-gift-baskets-the-crew-480.jpg 480w, /img/2025-12-gift-baskets-the-crew-960.jpg 960w, /img/2025-12-gift-baskets-the-crew-1600.jpg 1600w" imagesizes="100vw">` before the stylesheet link.

- [ ] **Step 3: Structured data**

Home (EN; FR mirrors with `inLanguage` fr-CA and the FR URLs): extend the `NGO` object with `"taxID":"713048502RR0001"`, `"foundingLocation":{"@type":"Place","name":"Montreal, Quebec, Canada"}`, `"address":{"@type":"PostalAddress","addressLocality":"Montreal","addressRegion":"QC","addressCountry":"CA"}`, `"knowsAbout":["food insecurity","community meals","volunteering","holiday gift drives"]`, `"potentialAction":{"@type":"DonateAction","target":"https://hub.welfareavenue.com/give"}`; add a second JSON-LD `{"@context":"https://schema.org","@type":"WebSite","name":"Welfare Avenue","url":"https://welfareavenue.com/","inLanguage":["en-CA","fr-CA"],"publisher":{"@type":"NGO","name":"Welfare Avenue"}}`.

Drive (EN; FR with its URLs and strings): `BreadcrumbList` (1 Home `https://welfareavenue.com/`, 2 Holiday Gift Basket Drive `https://welfareavenue.com/gift-basket-drive/`) and `FAQPage` with the five `Question`/`Answer` pairs whose `name` and `text` are the FAQ's visible strings (links removed from the text). Validate the JSON with `node -e` before committing.

- [ ] **Step 4: Sitemap**

Add `<lastmod>2026-11-02</lastmod>` to the four changed URLs, `<priority>1.0</priority>` to `/` and `/fr/`, `<priority>0.9</priority>` to the two drive URLs.

- [ ] **Step 5: Checks and commit**

Run: `node tools/check.mjs site` (title, description, canonical, og:url checks) and `node -e "JSON.parse(...)"` on each JSON-LD block.

```bash
git add site/index.html site/fr/index.html site/gift-basket-drive/index.html site/fr/paniers-cadeaux/index.html site/sitemap.xml
git commit -m "SEO: titles, descriptions, structured data and sitemap dates for home and the drive"
```

### Task 7: Final verification and pull request

- [ ] **Step 1: Full checks** `node tools/check.mjs site` → no FAIL. If `tools/node_modules` can be installed, `npm ci --prefix tools && npx --prefix tools playwright install chromium && node tools/browser-check.mjs site`; otherwise record that the browser check was not run.
- [ ] **Step 2: Browser pass** at 1280 px and 390 px on `/`, `/fr/`, `/gift-basket-drive/`, `/fr/paniers-cadeaux/`, `/about/`, `/volunteer/`: screenshots saved to the scratchpad; `scrollWidth <= innerWidth` on each; JavaScript disabled once (open with `javascript_tool` unavailable is not possible, so instead temporarily load a page with `site.js` blocked is not possible either: verify by reading that no CSS hides content without the `rv` class, and note it).
- [ ] **Step 3: Push and open the PR** with `gh pr create` into `main`: what changed and why, every page touched in both languages, screenshots, the "other places found" list, the SEO to-dos for Steel. Do not merge. Bind the PR with the ccd_pr tools and read its CI.
