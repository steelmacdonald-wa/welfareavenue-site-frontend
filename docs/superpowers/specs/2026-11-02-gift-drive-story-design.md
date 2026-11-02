# Design: the gift basket drive on the home page, a "Get involved" menu, scroll stories and SEO

Date: 2 November 2026. For: welfareavenue.com (this repository). Decided with Steel MacDonald; built by Claude.

## Intent and the why

Welfare Avenue's Holiday Gift Basket Drive (December 2026, Montreal, goal 6,000 gifts) is the charity's biggest moment of the year. Today it lives on one page, `/gift-basket-drive/`, reachable only from the events page, the volunteer group form and shared links. Steel wants the drive to be very clear, easy to find and easy to join from anywhere on the site, and he wants the site's stories (the drive, the mission, the history, how a volunteer day runs) to feel immersive as a visitor scrolls, with smooth motion.

Who visits (Steel, 2 Nov 2026): would-be volunteers (students and young people), donors, funders and sponsors, people looking for help (free meals and essentials), and press, partners and schools. The site serves all of them; the drive work must not push "Find support" out of sight.

## Goals

1. The drive gets its own section on the home page, with a button for each way an individual can get involved: give money, donate gifts and essentials, wrap with us. A quieter link for companies, schools and groups.
2. The main menu's "Volunteer" dropdown becomes "Get involved" and lists the drive first, on all 29 pages (the 28 twins and `site/404.html`, which carries the full header and footer), in both languages.
3. The drive page and the home page are optimized for search (on-page: titles, descriptions, structured data, internal links, a visible FAQ, image metadata, sitemap dates).
4. Stories feel immersive on scroll: the drive page ("How the season runs" and the growth from 1,500 to 3,000 to 6,000), the home page mission bands, the About page's "Since 2020" timeline, and the volunteer page's "How to join" and roles. Motion is smooth (transform and opacity only, CSS-driven where possible), respects reduced motion, and never hides content when JavaScript fails.
5. Other places where the same scroll treatment helps are found and listed (and get the shared, low-cost version of it).

## Non-goals

- No redesign of the hero, the header's layout or the footer's structure. The hero carousel gains one slide at most (see "My calls").
- No new page. The One Bag Challenge gets no page or copy of its own until Steel supplies the facts.
- No change to anything wired to the Hub: forms (`data-wa-form`), donation buttons (`data-wa-donate`, `data-wa-campaign`), sign-in, `data-upcoming`, campaign totals (`data-campaign`, `data-dr`). They may be moved and restyled around, never altered.
- No off-page SEO in this round (backlinks, Google Business Profile, Search Console submissions, press outreach). Listed as to-dos for Steel at the end.
- No translation changes beyond what this round adds.

## Anti-goals (what would make this a failure even if it worked)

- Motion that feels like a template: parallax photos, elements sliding in from the sides, bouncing, anything over about 700 ms, anything that moves while a visitor is reading live data (next servings, money raised).
- Content that is invisible until JavaScript runs, or that stays invisible for people who prefer reduced motion. Reduced motion means gentler (opacity only), not nothing.
- Any invented fact: a date for the wrapping event, a description of the One Bag Challenge, a new number.
- An outside script, font or image host. The security policy in `site/_headers` stays untouched.
- A French page whose structure drifts from its English twin: the house checks compare ids, heading order and photos between twins, and flag any English sentence of six words or more on a French page.
- A new hex colour, a new font, a dash character (the checks fail on em and en dashes), an `id` or `data-` attribute renamed.

## Constraints (from AGENTS.md, all binding)

- Static HTML, one main stylesheet `site/assets/site.css`, page stylesheets like `site/assets/drive.css`, scripts in `site/assets/` loaded with `defer`. No inline styles, `<style>`, inline scripts or `on...=` attributes. JSON-LD `<script type="application/ld+json">` is allowed.
- Both languages in the same pull request. 14 English pages, 14 French pages. Header and footer are copied into every page.
- Colours only from the CSS variables. Headings in Barlow Condensed, sentence case. Canadian spelling. No dashes.
- Cache stamps (`?v=`) are never edited by hand: the publish step sets them. Files in `assets/` are cached for a year, so edits to `site.css`, `site.js`, `drive.css`, `drive.js` are fine (the stamp changes), but a changed image needs a new file name.
- Work on a branch, open one pull request into `main`, never merge. Run `node tools/check.mjs site` before the PR. Check at 390 px and 1280 px.
- Facts: only what the site already says. The drive page's facts: 2024 with Scattered, more than 1,500 gifts; 2025 more than 3,000 gifts; 2026 goal 6,000; donations mid to end of November; wrapping over one or two weekends in December, dates coming soon; hand-delivery before the holidays; shelters and young patients in hospital; 446 baskets for six shelters last year; price estimates on the gift ladder.

## What gets built

### 1. The "Get involved" menu (29 pages: the 28 twins and `site/404.html`)

In `<header class="top">` on every page, the dropdown's top link reads **Get involved** (French: **S'impliquer**) and keeps its `href="/volunteer/"` (`/fr/benevolat/`), its classes and `id="dd-vol"`. The hidden button label becomes "More ways to get involved" ("Plus de façons de s'impliquer").

Menu items, in order:

1. **Holiday Gift Basket Drive** (new) with the small line "December 2026 · Aim: 6,000 gifts" (French: **Collecte de paniers-cadeaux**, "Décembre 2026 · Objectif : 6 000 cadeaux"). Link `/gift-basket-drive/` (`/fr/paniers-cadeaux/`). Icon: the gift icon already drawn on the drive page's "In kind" card (`.way-k .dd-ic`), reused. A small gold "This season" tag is not added: the first position and the gift icon carry it.
2. Volunteer in Montreal (unchanged)
3. Volunteer in Toronto (unchanged)
4. Collaborate with us (unchanged)
5. Join our team (unchanged)

On phones (below 1140 px) the items already list under the top link; nothing else changes. The dropdown's open and close motion stays as it is (it is a frequent action; no new animation).

The footer's "Explore" list gains **Holiday Gift Basket Drive** after "Volunteer as a group" on all 29 pages ("Collecte de paniers-cadeaux" in French), for discoverability and internal linking.

### 2. The drive section on the home page (`/` and `/fr/`)

A new band, `<section class="band on-cream drive-band" id="gift-basket-drive">`, placed **directly after the "Ways in" paths section and before the volunteers band**. "Find support", "Volunteer" and "Donate" stay the first things under the hero, so people looking for help are not pushed down; the drive is the first full band after them.

Layout (desktop, two columns in `.wrap.split`):

- Left: `p.over` "Holiday Gift Basket Drive · December 2026 · Montreal"; `h2` "This December, 6,000 gifts, hand-delivered"; one paragraph from the drive page's words ("Every December, our volunteers fill, wrap and hand-deliver holiday gifts across Montreal. Cozy socks, warm hats, toys and care packages go to guests at Montreal shelters and to young patients in hospital."); then **the growth story**: three horizontal bars labelled 2024 "1,500+ gifts", 2025 "3,000+ gifts", 2026 "6,000, our goal", widths 25%, 50%, 100% of the column, gold for the past years, outlined green for the goal. Then the buttons.
- Right: the wrapping photo `2025-12-gift-baskets-wrapping` (480 and 960 exist, `sizes="(min-width: 900px) 50vw, 100vw"`), alt text reused from the drive page's gallery.

Buttons (`.btns`), in this order:

1. `a.btn` **Give to the drive**, `href="https://hub.welfareavenue.com/give/?c=gift-basket-drive" data-wa-donate data-wa-campaign="gift-basket-drive"`, exactly as on the drive page (French link adds `&lang=fr` the way the drive page's French twin does; copy the French twin's attributes exactly).
2. `a.btn.ghost` **Donate gifts and essentials** → `/gift-basket-drive/#give-items`
3. `a.btn.ghost` **Wrap with us** → `/gift-basket-drive/#wrap-with-us`

   On the drive page these two hashes are also the pop-up ids that `forms.js` opens on arrival (`data-wa-popup-id`), so the buttons are one click to the form: a visitor lands on the drive page with "Tell us what you're giving" or "Sign up to help" already open, the page behind it. That is the behaviour Steel built for shared links, and the button labels promise exactly that action, so it is kept (my call).

4. A text link under the buttons: "Companies, schools and groups: see how to take part" → `/gift-basket-drive/#sponsors`

On phones the photo sits above the words, the bars stack, the buttons go full width (reuse the `.btns` phone rules).

The hero carousel gets a **new first slide** for the drive (my call, see below): photo `2025-12-gift-baskets-the-crew` (480, 960 and 1600 exist; the first slide is the page's largest paint, so it needs the 1600 width, which the wrapping photo lacks), tag "This December", line "Help us wrap and hand-deliver 6,000 holiday gifts across Montreal.", button "See the gift basket drive" → `/gift-basket-drive/`. It follows the carousel's existing markup for slides, panes and tabs (`hs-slide`, `hs-pane`, `hs-tab`, ids `hs-p0`...): the new slide becomes `hs-p0` and the others shift to `hs-p1`...`hs-p6`. The slideshow script counts slides from the markup and needs no change. The same slide, translated, goes on `/fr/`.

### 3. Scroll stories: one shared mechanism, used in four places

**Mechanism (site.js, site.css).** A small module at the end of `site.js`, in the house style (an IIFE with a comment naming the wave and the date):

- It runs only when `IntersectionObserver` exists. It marks elements with the class `rv` and, when they enter the viewport (threshold 0.15, `rootMargin: "0px 0px -10% 0px"`), adds `is-in` once and stops observing them. Because the class `rv` is added by the script, a page without JavaScript shows everything as it does today.
- Which elements: the script tags them by selector, so most pages gain the treatment without HTML edits: `.band .split > *`, `.paths li`, `.tiles .tile`, `.focus li`, `.ways .way`, `.steps li`, `.needs li`, `.timeline li`, `.drt li`, `.gtags .gt`, `.cards2 .card`, `.quote`, `.gallery > *`, `.drive-band .dgrow li`. It skips anything inside `.hero`, anything with `data-upcoming`, `[data-campaign]`, `[data-dr-gifts]`, `[data-wa-form]` and the forms' children (live or functional content never moves), and anything already inside the viewport at load above the fold (so the first screen never flickers: elements whose top is above `innerHeight` at the time the script runs get `is-in` immediately).
- Stagger: children of the same parent get `--rv-i` (0, 1, 2...) and a delay of `calc(var(--rv-i) * 60ms)`, capped at 6 so a long list never waits.
- CSS: `.rv{opacity:0;transform:translateY(14px);transition:opacity .6s var(--ease-out),transform .6s var(--ease-out);transition-delay:calc(var(--rv-i,0) * 60ms)} .rv.is-in{opacity:1;transform:none}`, with `--ease-out: cubic-bezier(.23,1,.32,1)` added to `:root`. Under `prefers-reduced-motion: reduce`, `.rv` keeps the opacity change at 0.2 s and drops the transform (the existing global reduced-motion rule sets `transition:none!important`; the reveal rule must still end with content visible, so `.rv` under reduced motion is `opacity:1;transform:none`).
- Counting numbers: elements with `data-count` (the home tiles' "14,000+", "600+", "250+" and the drive's "6,000") count up from 0 to their number over 900 ms with the strong ease-out when they enter, keeping the "+" and the locale's thousands separator (`toLocaleString('en-CA' or 'fr-CA')`). The number is in the HTML already, so without JavaScript or with reduced motion it simply shows. The script reads the number from the text and writes the text back; it adds no attributes the checks compare between twins other than `data-count` on both twins.
- Scroll-driven progress (progressive enhancement, CSS only): where the browser supports `animation-timeline: view()`, rails and bars are driven by scroll position rather than a one-shot reveal, inside `@supports (animation-timeline: view())`. Other browsers get the reveal. Performance: only `transform` and `opacity` animate; nothing animates `width`, `height` or layout; no blur, no `will-change` unless a shift is seen; no `transition: all`.

**Place 1: the drive page, `/gift-basket-drive/` and `/fr/paniers-cadeaux/`.**

- "How the season runs" (`#timeline`) becomes a three-chapter story. Desktop (900 px and up): a two-column layout, each chapter given `min-height: 55vh` so the three together are about one and a half screens (enough scroll for the sticky photo to change three times, not so much that the band feels empty; each chapter's text sits at the top of its block beside the gold rail), chapters on the left as the existing `ol.drt` (ids and headings unchanged), a sticky photo column on the right (`position: sticky; top: 96px`) showing one photo per chapter: November donations `2025-12-gift-baskets-bags`, December wrapping `2025-12-gift-baskets-wrapping`, before the holidays `2025-12-gift-baskets-delivery` (the twins must list the same photos in the same order). The active chapter's photo is on top (`opacity: 1`), the others fade (`opacity 0, transition .6s`) and the incoming one settles from `scale(1.03)`. The active chapter is chosen by the shared observer (the chapter nearest the middle of the viewport), which sets `is-on` on the chapter and its photo. A vertical gold rail beside the chapters fills as you scroll (`scaleY` via `view()` where supported, else it fills with the chapter reveals). Phones: the photos stack above each chapter's text; no sticky column; each pair reveals as it enters. The photos all exist at 480 and 960; `bags`, `wrapping` and `elf-hat` have no 1600, so their `srcset` lists two widths.
- The growth story in `#progress`: beside the big "6,000", the three bars (2024, 2025, 2026) as on the home page, driven by scroll where supported, otherwise revealing with a stagger. The live gifts counter and money card (`data-dr-gifts`, `data-campaign`) are left exactly as they are and are not animated.
- Everything else on the page gets the shared reveal (ways, gift tags, sponsor cards, gallery).

**Place 2: the home page.** The paths cards stagger in; the tiles count up; the four focus pillars reveal in order; the long E keeps its own existing animation (it already does what this round wants); the quote, news band and newsletter band reveal. The new drive band's bars grow as described.

**Place 3: About, "Since 2020" (`#story`).** The timeline's rail (`border-left` today) becomes a gold line that fills as you scroll (a pseudo-element with `transform: scaleY()`, `transform-origin: top`, driven by `view()` where supported), and each entry reveals as it enters with its gold square settling in (`scale(.6)` to 1). No layout change, no new ids or headings.

**Place 4: Volunteer, `/volunteer/` and `/fr/benevolat/`.** "How to join" (`ol.steps`): the three numbers 01, 02, 03 reveal in sequence (120 ms apart, the one exception to the 60 ms stagger because the sequence is the story), and a thin gold line draws between them on desktop (`scaleX` on a pseudo-element of the list, `transform-origin: left`). The roles grid (`.ways`, the role cards) staggers in. Live content (`data-upcoming`, the sign-up form) does not move.

**Other places found (they get the shared reveal with no HTML change):** the Toronto page's steps and needs lists; the events page's poster gallery and fundraiser cards; the donate page's gift list and box; the press page's clippings; the join page's role cards; the About page's team grid (team photos arrive from the Hub, so only the static grid wrapper reveals, not the photos as they load). Listed in the pull request so Steel can see what moved.

**Motion values (fixed, from Emil Kowalski's vocabulary, no approximations):** reveals 600 ms, `cubic-bezier(.23,1,.32,1)`, `translateY(14px)` to 0 with opacity; chapter photo crossfade 600 ms opacity with `scale(1.03)` to 1; count-up 900 ms; stagger 60 ms (120 ms for the three join steps); nothing bounces; nothing animates on hover except the existing button states; `:active` on `.btn` gets `transform: scale(.97)` with `transition: transform 160ms` (feedback on every press, today missing).

### 4. SEO (home and drive pages, both languages)

On-page, in this round:

- **Titles.** Drive: "Holiday Gift Basket Drive 2026, Montreal · Welfare Avenue" (French: "Collecte de paniers-cadeaux des Fêtes 2026, Montréal · Welfare Avenue"). Home: "Welfare Avenue · Youth-powered charity against food insecurity in Montreal and Toronto" (the French twin's equivalent). `og:title` matches.
- **Descriptions.** Drive, under 160 characters, naming what people search: "Give, donate gifts and essentials, or wrap with us: Welfare Avenue's Holiday Gift Basket Drive hand-delivers 6,000 gifts to Montreal shelters and young patients in hospital this December." Home: keeps its sentence, adds "Volunteer, donate or find a free Sunday meal." `og:description` matches.
- **Structured data.** Drive page: `BreadcrumbList` (Home → Holiday Gift Basket Drive) and `FAQPage` whose questions match a new visible FAQ (below). Home: the existing `NGO` object gains `taxID` "713048502RR0001" (on the site's footer), `nonprofitStatus` "Nonprofit501c3" is wrong for Canada so it is omitted, `foundingLocation` Montreal, `address` with `addressLocality` Montreal, `addressRegion` QC, `addressCountry` CA (no street, none is on the site), `knowsAbout` ["food insecurity", "community meals", "volunteering"], and `potentialAction` a `DonateAction` whose target is `https://hub.welfareavenue.com/give`. A `WebSite` object with `inLanguage` ["en-CA", "fr-CA"]. No `Event` for the drive until the wrapping dates exist (an Event needs a start date; inventing one is forbidden).
- **A visible FAQ on the drive page**, `<section class="band on-white" id="faq">`, "Questions about the drive", five `details.more` items whose answers are sentences already on the page: what can I donate (gently used clothing; new hygiene items and toys); when (mid to end of November for items; the wrapping event over one or two December weekends, dates coming soon); where do the gifts go (Montreal shelters, young patients in hospital, hand-delivered before the holidays); how do I volunteer (join the wrapping event, sign up on the page); can my company or school help (products, wrapping supplies, a team to wrap; write to info@). The French twin has the same five, translated. The `FAQPage` JSON mirrors them word for word.
- **Internal links.** The nav and footer items (above); the home drive band; the About timeline's December 2025 entry links "Holiday Gift Basket Drive" to the page; the home "Dignified resource distribution" pillar's sentence links the drive the same way.
- **Images.** `og:image:alt` on both pages; every drive photo keeps its alt. The drive hero photo gets `<link rel="preload" as="image">` with `imagesrcset` and `imagesizes` for faster largest-paint (the home hero already has `fetchpriority="high"`).
- **Robots and sitemap.** `<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">` on both pages and twins. `site/sitemap.xml` gains `<lastmod>2026-11-02</lastmod>` on the four changed URLs and `<priority>` 1.0 for `/` and 0.9 for the drive (left off the others). `robots.txt` is not touched.
- **Headings and words.** The drive page keeps one `h1`; every `h2` names the thing people search for ("Donate gifts and essentials in Montreal" stays "Donate gifts and essentials": the page is already clear, so headings are not stuffed). Body text is not changed for keywords.

What "best in Canada" needs beyond this round (for Steel, not built here): Google Business Profile for the Montreal address; Google Search Console and Bing Webmaster verified with the sitemap submitted; press and partner pages (Scattered, CEP, schools) linking to `/gift-basket-drive/`; a short news item or post each year with photos; Core Web Vitals watched after publish; an `Event` object once the wrapping dates are set.

## My calls (not Steel's decisions; he can reverse any)

- Motion is hand-written CSS and JavaScript in `assets/`. A library would need the security policy changed.
- Facts come only from the site. The One Bag Challenge is not named until Steel says what it is.
- The home drive band sits after the three "ways in", not above them, so "Find support" stays where it is.
- The hero carousel gains a first slide for the drive, with the crew photo (the only drive photo with a 1600 width). If Steel prefers the carousel unchanged, drop the slide; the band alone still meets the goal.
- The home band's item and wrap buttons deep-link to the drive page's pop-up forms (one click to the form).
- The chapter story on the drive page is about one and a half screens tall on desktop (55 vh per chapter), compact on phones.
- `site/404.html` gets the same header and footer edits as the 28 twins.
- The dropdown's top link keeps pointing at `/volunteer/`.
- `:active` press feedback on all `.btn` buttons (a small site-wide polish that comes free with the motion tokens).
- The reveal is applied by selector from the script so other pages gain it without HTML edits. Pages Steel does not want to move can opt out with `data-rv="off"` on a band.
- Reveal distance 14 px and 600 ms: long enough to read as deliberate on a marketing page, short enough that a fast scroller never waits.

## Left to the builder

- Exact French wording for new strings (Quebec French, same meaning; no English sentence of six words or more on a French page).
- The gift icon's SVG path and the bars' exact markup, as long as both twins match in ids, headings and photos.
- The exact selectors and thresholds, as long as the hero, live data and forms never move and nothing hides without JavaScript.
- Where in `site.css` each rule goes (end of its group, with a short comment), including the phone rules at the existing breakpoints (899/900 px, 1139/1140 px, 480 px, 400 px).
- The branch name (`claude/gift-drive-story`) and the pull request text, which lists every page touched in both languages and the screenshots at 390 px and 1280 px.

## Done means

- `node tools/check.mjs site` passes with no FAIL.
- Every page's header shows "Get involved" with the drive first; every footer lists the drive.
- The home page shows the drive band with its three buttons and the growth bars, in both languages.
- The drive page has the chapter story, the growth bars, the FAQ and the structured data; the home page has its structured data; the sitemap has dates.
- Reveals, counts and chapters work at 390 px and 1280 px, with reduced motion on (opacity only, everything visible) and with JavaScript off (everything visible, nothing moves).
- One pull request is open against `main`, not merged.
