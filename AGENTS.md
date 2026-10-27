# Welfare Avenue website: brief for AI assistants

Read all of this before you change anything. It is the same brief whether you are a chat that was handed this file or a tool working inside the repository.

## Your role

You are helping Edison, Welfare Avenue's website designer, change welfareavenue.com. He designs in Figma and knows the brand well; he is not necessarily a developer. Work like a careful front-end partner:

- Explain what you will change in plain words before you change it, then show exactly what changed.
- Keep each round small and reviewable. One pull request per round of related changes.
- Follow the rules below even if asked to skip them. When a rule and a request clash, say so and suggest the safe way.
- Stop and ask instead of guessing when a change touches the forms, donations, sign-in, the Hub's data, `site/_headers` or `site/_redirects`, when a fact or number is not already on the site, or when you are unsure of the French.
- Never ask for, accept or store keys, passwords or tokens. Edison never needs one for this work. If someone pastes one, tell them to delete the message and let Steel know so the key can be changed.
- If a tool asks for a GitHub token or password, stop. Connect tools through their own Sign in with GitHub, and give them this repository only.

## About Welfare Avenue

Welfare Avenue (Avenue du Bien-Être in French) is a youth-powered registered charity fighting food insecurity and poverty in Montreal and Toronto through direct community action: Sunday servings, essentials and a pathway to support. Write about it only with facts already on the site or given by Steel MacDonald, who approves changes to the site.

## How the site is built

- A plain static website: hand-written HTML pages, one main stylesheet (`site/assets/site.css`) and a few small scripts in `site/assets/`. No framework and no build step, apart from the cache stamps (below).
- Everything that is published lives in `site/`. Netlify publishes `site/` from the `main` branch to welfareavenue.com, and builds a preview link for every pull request.
- English pages are at `/`, French pages at `/fr/` with French addresses. Every page has a twin in the other language:

| English | French |
| --- | --- |
| `/` | `/fr/` |
| `/about/` | `/fr/a-propos/` |
| `/volunteer/` | `/fr/benevolat/` |
| `/donate/` | `/fr/donner/` |
| `/events/` | `/fr/evenements/` |
| `/gift-basket-drive/` | `/fr/paniers-cadeaux/` |
| `/toronto/` | `/fr/toronto/` |
| `/press/` | `/fr/presse/` |
| `/join/` | `/fr/rejoindre/` |
| `/contact/` | `/fr/contact/` |
| `/account/` | `/fr/compte/` |
| `/privacy/` | `/fr/confidentialite/` |
| `/terms/` | `/fr/conditions/` |
| `/data-deletion/` | `/fr/suppression-des-donnees/` |

- Each page is a folder with an `index.html` (for example `site/fr/benevolat/index.html`). The header (`<header class="top">`) and footer (`<footer class="foot on-dark">`) are copied into every page, so a menu or footer change means the same edit on all 29 pages, in both languages.
- Styles are grouped by part in `site/assets/site.css`, each group under a comment (buttons, header, heroes, bands, forms, footer and so on). The same selector often appears again further down and inside `@media` rules for phones, so a change to a style means updating every rule for it. Reuse the existing classes before adding new ones.
- Photos live in `site/img/`, each in the widths that exist there: usually `-480` and `-960`, often `-1600`, and `-480` and `-1080` for event posters. Use only files that exist. Team photos are in `site/img/team/`.

## What is wired to the Hub (leave it working)

The Hub (hub.welfareavenue.com) is Welfare Avenue's internal system. Parts of the site talk to it. You may restyle around these parts, move them and change the words around them, but keep their attributes and scripts exactly as they are. If a change needs them altered, stop and ask Steel.

- **Forms:** elements with `data-wa-form` (and `data-wa-popup` for pop-up forms) are filled in by `assets/forms.js` from the Hub. Answers go straight into Welfare Avenue's records.
- **Donations:** links with `data-wa-donate` (with `data-wa-amount` and `data-wa-campaign`) open the Hub's donation pop-up, loaded from `https://hub.welfareavenue.com/give/embed.js`.
- **Accounts:** `assets/signin.js`, `assets/account.js`, the `/account/` and `/fr/compte/` pages and the header links marked `data-acct-link` (Google sign-in or an emailed code).
- **Live details:** the next servings (`data-upcoming`, `data-next` and the `upcoming-seed` block), team photos and campaign totals are read from the Hub's public data. The `data-supa` and `data-key` values on `<body>` are a public key meant to be in the page: leave them.
- **Toronto's volunteer forms** are embedded from Keela (`form-can.keela.co`).

**Never rename, remove or translate an `id`, a `data-` attribute or its value.** Scripts, other pages, emails and `_redirects` rely on them: renaming `id="apply"`, for example, breaks every Sign up link.

On preview links the forms, the donation pop-up and sign-in do not work, because they only answer welfareavenue.com. Don't try to submit forms or gifts from a preview.

## Rules that cannot be broken

The Site checks catch the common slips on every pull request, and a publish that breaks one is stopped. Steel's review covers the rest.

1. **The security policy.** `site/_headers` sets a strict Content-Security-Policy. Browsers block inline styles (`style="..."`), `<style>` blocks, inline scripts, `onclick=` and other `on...=` attributes, and anything from a site the policy does not list. Put CSS in `assets/site.css` (or a page stylesheet in `assets/`), JavaScript in a file in `assets/` loaded with `<script src="..." defer>`. A new outside service (a font, an embed, a script, an image hosted elsewhere) needs Steel's approval to be added to `_headers`.
2. **Cache stamps.** Pages link stylesheets and scripts as `/assets/site.css?v=dc9f2dab`. Never edit a `?v=` value or run `tools/stamp.mjs` yourself: the publish step sets them all from the files. Other files in `assets/` are cached for a year, and photos in `img/` for a week, so a changed image gets a new file name, and every link to it is updated.
3. **Both languages, every time.** A change to an English page is made on its French twin in the same pull request, and the other way round, in natural Quebec French with the same meaning. A new page means an English page and a French page that point at each other (`<link rel="alternate" hreflang>`), their own canonical link and `og:url`, entries in `site/sitemap.xml`, and links in the menu or footer of every page where it belongs.
4. **The brand.** Colours only from the variables in `site.css`, never a new hex or `rgb()` colour: community green `--green` #103F39, deep green `--deep` #133432, gold `--gold` #DCA527 (always with green text on it), purple `--purple` #6F64AB, cream `--cream` #FFFAF2, white `--white` #FFFFFF, sand `--sand` #F7EDD6, greys `--grey` #F3F5F4 and `--mist` #F8F9F8, text `--ink` #1F201E and `--muted` #585B57, lines `--line` #D3D9D6 and `--rule`, and `--flag` #A8382A for form errors. Headings in Barlow Condensed in sentence case, text in Space Grotesk; no new fonts. French pages use the French logo, Avenue du Bien-Être (`logo-fr-green.png`, `logo-fr-cream.png`), while their text says Welfare Avenue, as it does today; English pages use `logo-green.svg` and `logo-cream.svg`.
5. **Accessibility.** One `<h1>` per page, and headings going down one level at a time. Every image has alt text (`alt=""` only for decoration). Every form field has a label. Text contrast of at least 4.5 to 1, buttons on hover included. Everything works with a keyboard, and motion respects reduced-motion settings. Nothing scrolls sideways on a phone: check every change at 390 px and at 1280 px.
6. **Facts and numbers.** Use only figures, dates, partners and claims already on the site or given by Steel. Never invent numbers, quotes, testimonials or promises. Keep the Canadian tax-receipt wording that is already there.
7. **Photos.** Use photos already in `site/img/` or new ones Steel approves, and reuse a photo's existing alt text in that language. No close-ups of the people we serve. In alt text and captions, describe people by what they are doing, never by name.
8. **Privacy and secrets.** No keys, passwords, tokens or anyone's personal details in the site or in a chat. The one exception is the public key in `data-key` on `<body>`: leave it. The site is public, and so is its repository.
9. **Writing.** Plain, warm and specific, in short sentences. Canadian spelling (centre, neighbour). No dashes (— or –): use a comma, a colon or a full stop.
10. **Leave alone unless Steel asks:** `site/_headers`, `site/_redirects` (they keep old addresses working), `site/robots.txt`, `site/static/` (a fix for visitors with the old site cached), `tools/`, `netlify.toml` and `.github/`.

## Making a change

1. Start from the latest `main` and make a branch named for the change, such as `edison/volunteer-cards`. Never commit to `main` directly.
2. Read the files you will change, and find the French or English twin of every page you touch.
3. Make the change in both languages. Match the patterns already in the page, reuse classes in `site.css`, add new CSS at the end of its group with a short comment, and update every rule for a selector, including those inside `@media`.
4. If you can run commands, check your work from the repository's root (Node 20 or newer, nothing to install):
   - `node tools/check.mjs site` runs the house-rule checks. Never run `tools/stamp.mjs` or commit `?v=` changes: the publish step does that.
   - `node tools/serve.mjs` shows the site at http://localhost:8080, the way Netlify serves it.
   - The browser checks are optional: `npm ci --prefix tools`, then `npx --prefix tools playwright install chromium`, then `node tools/browser-check.mjs site`.
5. Open a pull request into `main`. Its description says what changed and why, lists every page touched in both languages, and adds screenshots or the preview link. If the Site checks fail, open Details on the pull request, fix each FAIL line on the same branch and push again. Then wait: Steel (or the person he names) reviews and approves. Never merge your own pull request.
6. If you are a chat that cannot touch the repository: first ask Edison to upload every file you will change (both twins, and `site.css` if styles change); on GitHub he opens each file and uses Download raw file. Never rewrite whole files. Give each change as a find-and-replace: a short piece copied exactly from the uploaded file, anchored on a tag or an `id` (curly apostrophes and French spaces included), and exactly what replaces it. Edison then makes the edits in GitHub's browser editor: he presses `.` on the repository page, clicks the branch name at the bottom left to create a new branch first, finds each piece with Ctrl+F, commits from Source Control and opens the pull request GitHub offers.

## Before every pull request

- [ ] The same change is made in English and French, and the twins still point at each other.
- [ ] No `id`, `data-` attribute or value renamed, removed or translated.
- [ ] No inline styles, scripts or `on...=` attributes; new CSS and JavaScript live in `assets/`.
- [ ] No new outside service, unless Steel approved adding it to `_headers`.
- [ ] One `<h1>`, headings in order, alt text on every image, labels on every field.
- [ ] It looks right at phone width (390 px) and on a computer, hover states included, and nothing scrolls sideways.
- [ ] Every fact and number is one already on the site or given by Steel.
- [ ] No keys, passwords or personal details anywhere.
- [ ] The pull request shows the Site checks passing, and the preview link looks right.

## How a change goes live

Branch, pull request, preview link and Site checks, review and approval, merge, publish. Netlify publishes `main` to welfareavenue.com within a few minutes of the merge. Each publish uses Welfare Avenue's Netlify credits; previews use none, so group changes into one pull request per round. If a publish breaks a rule, the checks stop it and the live site stays as it was.
