## What this project is

Source for **decodewithvenu.com** — Venu Uppaluri's personal site (strategy, analytics, AI
articles, plus a couple of interactive "Casual Projects" tools). Built with Astro + Tailwind,
deployed on Vercel. This file is the standing brief — read it before doing anything else, so
you don't have to be re-taught the setup from scratch in a new conversation.

## Hosting & deployment

- **Live domain**: https://www.decodewithvenu.com (apex redirects to www)
- **Vercel project**: `decode-with-venu`, team/org `decode-with-venu` — already linked in
  `.vercel/project.json`. Logged-in Vercel CLI is required (`npx vercel whoami` to check;
  `npx vercel login` — device-code flow — if not authenticated).
- **GitHub repo**: `git@github.com:uppalurivenugopal/decode-with-venu.git`, branch `main`.
  The Vercel project is linked to this repo with `main` as the production branch (verified
  via the Vercel API, Oct 2026). **A push to `main` automatically deploys to production** —
  the live deployment carries the pushed commit's SHA and message. No separate deploy step
  is needed for committed changes.

**Standard workflow for any change to this site — always do all of these, in order:**

1. Review what changed (`git status` / `git diff`) before touching anything, especially if
   files were edited outside the current conversation.
2. `npm run build` — must complete clean before shipping.
3. Spot-check the change visually. Use `npx astro dev --background` (see Development below)
   or serve `dist/` with `python3 -m http.server <port>` and check it in the Browser pane.
4. `git add` the specific files (never a blind `-A` without checking status first), commit,
   `git push origin main`. **This push is what deploys to production** (see above).
5. Verify the live URL with `curl` and/or the Browser pane (give Vercel ~15-30 seconds to
   build). `npx vercel ls` shows deployment status if something looks stale.
6. Only use `npx vercel deploy --prod` for a manual redeploy without a new commit — and
   note it uploads the whole **working folder, including uncommitted and untracked files**,
   not just what's in git. If other work-in-progress is sitting in the folder, it ships too,
   so set it aside first or just push instead. (A "Not authorized" error from the CLI is
   usually transient; retry once.)

**Other windows may be editing this repo at the same time.** Before committing, always check
`git status` for changes you didn't make and leave them out of your commit. If git reports a
stale `.git/index.lock` with no running git process, check what holds it open (`lsof`) and
confirm with the user before deleting it.

Never touch domain or DNS settings without being explicitly asked to.

## Brand system (as of the Sept 2026 rebrand)

Warm editorial theme — deliberately **not** a dark-tech/SaaS look. Single theme, no light/dark
toggle (removed in the rebrand).

- **Colors** (`src/styles/global.css` `@theme` block): `--color-ink-950` (warm cream bg),
  `--color-fg`/`--color-edge` (near-navy #13283c), `--color-cyan-glow` (actually a brick/rust
  red, ~#a94432 — the name is legacy from the old dark-tech palette), `--color-indigo-glow`
  (muted slate blue).
- **Type**: `--font-serif` (Source Serif 4) for headlines, `--font-sans` (DM Sans) for body.
  No gradients, no glow/blur decorative effects (`.gradient-text`, `.glow`, `.bg-grid` are
  intentionally neutered to no-ops in CSS — don't re-enable them).
- **Cards**: flat, `border-radius: 0`, top-border-only (`.card` in global.css), not
  rounded/shadowed.
- **Eyebrow labels** (small caps tag above a heading): `text-[13px] font-bold uppercase
  tracking-[0.14em] text-cyan-glow` — this exact size/weight, sitewide. Don't reintroduce the
  smaller/dimmer 11px pattern.
- **Headlines**: `font-serif ... font-semibold` at large sizes (`text-5xl sm:text-6xl` for
  page heroes, `text-4xl sm:text-5xl` for article titles) — never the old sans
  `font-extrabold tracking-tight`.
- **Nav**: `src/components/Nav.astro` — a fixed left sidebar on desktop (`md:` and up), a
  slim top bar + hamburger dropdown on mobile. Not a horizontal top nav.
- **Logo**: `src/components/Logo.astro` — a custom SVG mark (three converging brick-red
  strokes into one navy line — the "signal resolved" concept), not a gradient/terminal icon.

## Content structure

Three parallel content collections, all following the identical pattern — copy an existing
one when adding a new section, don't invent a new structure:

- `src/content/{concepts,strategies,perspectives}/*.md` — frontmatter: `title`, `subtitle?`,
  `description`, `date`, `source?` (link back to original if republished, e.g. from LinkedIn).
  Schema lives in `src/content.config.ts`.
- `src/pages/{strategies,perspectives}/index.astro` — listing page, card grid, pulls a
  `/images/articles/<slug>.png` thumbnail (public/, not the content folder) per entry, with an
  `onerror` fallback that hides the thumbnail slot if missing.
- `src/pages/{strategies,perspectives}/[slug].astro` — article template: hero (eyebrow, serif
  h1, subtitle), then `<div class="prose-decode"><Content /></div>`, then the "Originally
  published on LinkedIn" attribution block if `source` is set.
- In-article images live in `src/content/<collection>/images/` and are referenced with a
  relative path (`./images/foo.png`) directly in the markdown.
- `concepts` also supports a `series`/`seriesIndex` field for multi-part series (see
  `src/pages/concepts/index.astro` and `[slug].astro`).

`src/pages/projects/` (Casual Projects) is different — each is a bespoke interactive tool
(vanilla JS state machine), not a content-collection article. `governance-passport.astro` is
the fullest example of the pattern: hero section using shared Tailwind/brand classes, then a
`<div id="stage">`-scoped tool with its own `<style is:global>` block that maps the tool's own
CSS variables onto the site's `--color-*` tokens (so it re-themes automatically if the brand
palette changes) and a plain `<script>` (not `is:inline`) holding the tool's logic.

## Forms & analytics

- Contact, Guest Lectures, and Subscribe ("Alert Me") forms all POST to
  `https://formsubmit.co/venu@decodewithvenu.com` (no backend of our own). **The first
  submission to a new form action triggers a confirmation email FormSubmit sends to that
  address — it must be clicked once, or later submissions silently don't arrive.**
- Vercel Web Analytics is wired into `Layout.astro` (`@vercel/analytics`, aggregate pageviews
  only, no cookies/PII). It requires "Web Analytics" to be toggled on for the project in the
  Vercel dashboard (Project → Analytics tab) — a one-time, dashboard-only setting; there's no
  CLI switch for it.
- **Google Analytics 4** (Measurement ID `G-JP76TKZHSB`) is loaded only after the visitor clicks
  Accept on the cookie notice — `src/components/CookieConsent.astro` (included in
  `Layout.astro`) holds the ID, the banner, and the loader. Declined/undecided visitors get no
  GA script and no cookies. The choice is stored in `localStorage` under `cookie-consent`.
  `/privacy` (`src/pages/privacy.astro`) explains all data collection and has a "Change my
  cookie choice" button. If a new data-collecting tool is added, update that page too.
- OG/social preview images: `Layout.astro` takes an `image` prop (defaults to
  `/images/og/default.png`); pass a page-specific one via
  `<Layout image="/images/og/whatever.png">`. Absolute URLs are built automatically from
  `astro.config.mjs`'s `site` value.

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.
If a session's Vite dev server misbehaves (stuck HMR websocket after repeated restarts),
prefer serving the static `npm run build` output instead of fighting the dev server.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
