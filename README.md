# Xamidovvv — personal digital identity

*Building from ideas.* A bilingual (EN/RU) single-page personal site for Sardor / Xamidovvv.
React 19 + TypeScript + Vite, no backend, no paid services. Runtime dependencies: `react`, `react-dom` only
(the QR generator is in `src/utils/qr.ts`).

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build → dist/
npm run preview    # serve dist/ locally
```

## Edit your content

| What | Where |
| --- | --- |
| Name, brand, tagline, social links, music, projects, skills, games | `src/config/site.ts` |
| All page text and UI labels (English / Russian) | `src/i18n/en.ts`, `src/i18n/ru.ts` |
| Colours, type, spacing | `src/styles/global.css` (tokens at the top) |
| Particle scene per section | `src/scene/engine.ts` (`MOODS` table) |

**Still to fill in (nothing is invented):**
- **Projects** — `projects` in `src/config/site.ts` (`url` is optional; Jarvis has none).
- **Skills** — CapCut and "learning AI" are in; more sample videos go in `public/video` and `samples` in `site.ts`.
- `public/og.png` — share preview (neutral palette, "Xamidovvv" as the title).

## Public URL → QR code, copy, share, previews

Set `VITE_SITE_URL` at build time (see `.env.example`), e.g. `https://your-project.pages.dev`.
It drives the QR code, copy/share and the absolute `og:url` / `og:image` / canonical tags.
Without it the QR panel shows an explanatory state locally (no fake URL is ever used).
If it's unset but the site is served from a public host, the live address is used.

## Music

No audio is bundled. "Зима" — Вектор А is offered through **Spotify's official embed**
(track verified: released 2026-01-30). Nothing from Spotify loads until a visitor presses Play; Stop unmounts the player.
A "Listen on Spotify" link and an Apple Music artist link are always shown. If you ever get the rights to a file, set
`music.audioSrc` (e.g. `/audio/zima.mp3`) and the player switches to native play / pause / stop.

## Deploy free (Cloudflare Pages)

1. Push this folder to a GitHub repo.
2. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → pick the repo.
3. Build command `npm run build`, output directory `dist`.
4. Environment variable: `VITE_SITE_URL` = your `https://<project>.pages.dev` address (set it after the first deploy, then redeploy).

Other static hosts work the same (upload `dist/`). **Free-plan limits** (Cloudflare docs, checked 2026-10-17):
500 builds/month, 20,000 files per site, 25 MiB max file size, 100 custom domains. Free plans can change and carry
usage/terms constraints; a custom domain is optional.

## Accessibility & performance notes

Semantic landmarks, skip link, visible focus, keyboard-operable menu (Esc, focus trap), `prefers-reduced-motion`
(static scene frame, no hidden-until-animated content), 44px touch targets, no hover-only functions.
The scene is a plain 2D canvas (≈820 points desktop / 300 mobile), pauses when the tab is hidden, drops points if
frames run slow, and falls back to a CSS ring if canvas is unavailable. Fonts: Inter / Inter Display (OFL), self-hosted.
