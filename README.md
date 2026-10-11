# pathwaydevs.tech

Static site, no build step on Netlify: publish the repo root. The pages are generated locally and the output is committed.

## Layout

- `index.html` (home, with tabs: Home / What We Offer / About / Contact, routed by URL hash) is generated from `content/home.html`.
- `apps/index.html` and `apps/<slug>/index.html` are generated from `content/apps.json`.
- `sitemap.xml` and `robots.txt` are generated too.
- `assets/apps/*.webp` are real screenshots of the live apps (headless Chromium, desktop 1440px wide, no account data). `assets/og/*.jpg` are 1200x630 social images cut from them.
- `site.config.json` holds the public company name, phone numbers and the Google Analytics ID.

## Edit and rebuild

```
node tools/build.mjs    # needs Node 18+ and python3 with Pillow (only to read image heights; falls back to 800)
python3 -m http.server 8099   # preview at http://localhost:8099
```

Edit `content/*` or `tools/build.mjs`, rebuild, commit the generated files with the sources.

## Company name switch (do NOT do this until the state filing is approved)

The public name is "John Gault & Sons" (no LLC). To switch to "John Gault & Sons LLC":

1. In `site.config.json` set `"useLLC": true`.
2. `node tools/build.mjs`
3. Commit on its own as `Switch public name to John Gault & Sons LLC`.

The name appears in the page footers and in the home page JSON-LD only.

## Analytics

Google Analytics (G-H7XBWN26QY) is kept, but it now loads only after a visitor presses Accept on the cookie banner, the same as Round Table, AI Reality and Formation. The choice is stored in localStorage (`pd-tech-analytics-consent`). The footer has a "Cookie choice" button to reopen it.

## Rules for copy on this site

No invented testimonials, client names, counts, revenue, years, awards, guarantees or discounts. Every app page states its real status, and screenshots must come from the live app.
