# Decode with Venu

Source for [decodewithvenu.com](https://www.decodewithvenu.com) — built with [Astro](https://astro.build) and Tailwind CSS.

## Structure

- `src/pages/` — one file per route (`about.astro`, `decode-framework.astro`, `strategies.astro`, `perspectives.astro`, `subscribe.astro`, `concepts/`)
- `src/content/concepts/` — Concepts articles, written in Markdown. Add a new `.md` file here (with frontmatter matching the existing ones) to publish a new article — it's picked up automatically by `/concepts` and the nav dropdown.
- `src/components/` — shared UI (Nav, Footer, cards, etc.)
- `public/images/venu.jpg` — add your photo here to replace the placeholder avatar on the About page.

## Commands

| Command           | Action                                      |
| :----------------- | :------------------------------------------ |
| `npm install`       | Install dependencies                        |
| `npm run dev`       | Start local dev server at `localhost:4321`  |
| `npm run build`     | Build the production site to `./dist/`      |
| `npm run preview`   | Preview the production build locally        |

## Deploying

This is a fully static site — the easiest path is [Vercel](https://vercel.com):

1. Push this folder to a GitHub repo.
2. Import the repo in Vercel (it auto-detects Astro).
3. Add `decodewithvenu.com` as a custom domain in the Vercel project settings and update your DNS records as instructed.

## To do before going live

- Drop a real photo at `public/images/venu.jpg` (replaces the "VU" placeholder on `/about`).
- Wire up `/subscribe` to an email provider (Buttondown, ConvertKit, or Mailchimp all have simple form-embed options).
- Write the first Strategies and Perspectives posts (currently "coming soon").
