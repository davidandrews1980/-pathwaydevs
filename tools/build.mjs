#!/usr/bin/env node
/* Static page generator for pathwaydevs.tech. No dependencies. Run: node tools/build.mjs
   Reads site.config.json + content/*, writes index.html, apps/**, sitemap.xml, robots.txt.
   Generated files are committed, so Netlify needs no build step (publish the repo root). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'site.config.json'), 'utf8'));
const data = JSON.parse(fs.readFileSync(path.join(root, 'content/apps.json'), 'utf8'));
const guides = JSON.parse(fs.readFileSync(path.join(root, 'content/guides.json'), 'utf8'));
const TAVUS = `    <script src="https://unpkg.com/@tavus/widget@latest"></script>
    <tavus-widget deployment-id="e3816ac1-c55a-4c39-84a2-bf463147d454"></tavus-widget>
`;
const homeTpl = fs.readFileSync(path.join(root, 'content/home.html'), 'utf8');

const legal = cfg.useLLC ? cfg.legalNameLLC : cfg.legalName;
const V = cfg.lastmod.replace(/-/g, '');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const abs = (p) => cfg.siteUrl + p;
const write = (rel, txt) => { const f = path.join(root, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, txt); };

const badge = (a) => `<span class="badge ${a.status === 'live' ? 'badge-live' : a.status === 'beta' ? 'badge-beta' : 'badge-soon'}">${esc(a.statusLabel)}</span>`;

const NAV = [
  ['landing', 'Home', '/'],
  ['offerings', 'What We Offer & Why', '/#offerings'],
  ['apps', 'Apps', '/apps/'],
  ['about', 'About Us', '/#about'],
  ['contact', 'Contact Room', '/#contact'],
];

function head({ title, desc, canonical, ogImage, ogType = 'website', extra = '' }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(desc)}">
    <link rel="canonical" href="${abs(canonical)}">
    <meta name="theme-color" content="#09050e">
    <meta property="og:site_name" content="Pathway Devs">
    <meta property="og:type" content="${ogType}">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(desc)}">
    <meta property="og:url" content="${abs(canonical)}">
    <meta property="og:image" content="${abs(ogImage)}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${esc(title)}">
    <meta name="twitter:description" content="${esc(desc)}">
    <meta name="twitter:image" content="${abs(ogImage)}">
    <link rel="icon" type="image/png" sizes="64x64" href="/assets/favicon-64.png">
    <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
    <link rel="stylesheet" href="/assets/css/site.css?v=${V}">
${extra}</head>`;
}

function header(activeKey) {
  const items = NAV.map(([k, label, href]) => {
    const isActive = k === activeKey;
    const tab = k === 'apps' ? '' : ` data-tab="${k}"`;
    return `                <li><a href="${href}" id="nav-${k}"${tab} class="${isActive ? 'active' : ''}"${isActive ? ' aria-current="page"' : ''}>${esc(label)}</a></li>`;
  }).join('\n');
  return `    <a class="skip-link" href="#main">Skip to content</a>
    <div class="motto-bar">
        SCIRMEN &bull; ENECH &bull; TRIUWA &bull; AITHGHEN
    </div>

    <header>
        <a class="logo-container" href="/" aria-label="Pathway Devs home">
            <img src="/assets/logo-128.webp" width="64" height="76" alt="John Gault · Pathway Devs · Inti Sine Sune crest" class="logo-img">
            <span class="brand-name">Pathway <span>Devs</span></span>
        </a>
        <nav aria-label="Main">
            <ul>
${items}
            </ul>
        </nav>
    </header>
`;
}

function footer() {
  const links = [['/', 'Home'], ['/apps/', 'Apps'], ...data.live.map((a) => [`/apps/${a.slug}/`, a.name])]
    .map(([h, l]) => `<a href="${h}">${esc(l)}</a>`).join('\n            ');
  return `
    <footer>
        <p>&copy; 2026 Pathway Devs &middot; ${esc(legal)}. All Rights Reserved.</p>
        <p style="margin-top:10px;">Business <a href="tel:2313201550">${cfg.businessPhone}</a> &middot; Text <a href="sms:2489792893">${cfg.textPhone}</a></p>
        <p style="margin-top:16px;font-size:0.9rem;opacity:0.85">Our policies are hosted on this domain. Analytics load only after you accept.</p>
        <div class="footer-links">
            ${links}
            <a href="/privacy.html">Privacy</a>
            <a href="/terms.html">Terms</a>
            <a href="/cookies.html">Cookies</a>
            <a href="/policies/">App policies</a>
            <a href="mailto:support@pathwaydevs.org">support@pathwaydevs.org</a>
            <button type="button" class="linklike" id="pd-cookie-settings">Cookie choice</button>
        </div>
    </footer>

    <div id="pd-consent" class="pd-consent" role="region" aria-label="Cookie notice" data-ga-id="${cfg.gaMeasurementId}" hidden>
        <p>Can we use cookies for anonymous usage analytics (Google Analytics)? Nothing loads unless you accept.</p>
        <button type="button" class="pd-no" id="pd-consent-decline">Decline</button>
        <button type="button" id="pd-consent-accept">Accept</button>
    </div>
`;
}

function homeCard(a) {
  return `                <article class="card app-card">
                    <a class="card-link" href="/apps/${a.slug}/">
                        <div class="app-meta">${badge(a)}</div>
                        <h3>${esc(a.name)}</h3>
                        <p>${esc(a.cardBlurb)}</p>
                        <span class="more">See the page &rarr;</span>
                    </a>
                </article>`;
}

/* ---------------- home ---------------- */
function buildHome() {
  const body = homeTpl
    .replace('{{HOME_APP_CARDS}}', data.live.map(homeCard).join('\n'))
    .replace(/\{\{PHONE\}\}/g, cfg.businessPhone)
    .replace(/\{\{TEXT\}\}/g, cfg.textPhone);
  const title = 'Pathway Devs | Systems Architecture, AI Automation & Working Apps';
  const desc = 'Systems architecture, custom AI automation, SOP templates and CRM integration for mid-sized businesses, plus live apps we built and run ourselves.';
  const ld = {
    '@context': 'https://schema.org', '@type': 'Organization', name: 'Pathway Devs', legalName: legal, url: abs('/'),
    logo: abs('/assets/apple-touch-icon.png'), telephone: '+1-' + cfg.businessPhone,
  };
  const extra = `    <script type="application/ld+json">${JSON.stringify(ld)}</script>\n`;
  return head({ title, desc, canonical: '/', ogImage: '/assets/og/default.jpg', extra }) + `
<body>

${header('landing')}
    <main id="main">

${body}
    </main>
${footer()}
    <script src="/assets/js/site.js?v=${V}" defer></script>
${TAVUS}</body>
</html>
`;
}

/* ---------------- apps index ---------------- */
function indexCard(a) {
  return `                <article class="card app-card">
                    <a class="card-link" href="/apps/${a.slug}/">
                        <div class="app-meta">${badge(a)}</div>
                        <h3>${esc(a.name)}</h3>
                        <p>${esc(a.cardBlurb)}</p>
                        <p class="est-date">${esc(a.urlLabel)}</p>
                        <span class="more">Screenshot, status and link &rarr;</span>
                    </a>
                </article>`;
}
function soonCard(c) {
  return `                <article class="card app-card">
                    <div class="app-meta"><span class="badge badge-soon">Coming soon</span></div>
                    <h3>${esc(c.name)}</h3>
                    <p>${esc(c.blurb)}</p>
                </article>`;
}
function buildAppsIndex() {
  const title = 'Apps | Working software from Pathway Devs';
  const desc = 'Six live apps built and run by Pathway Devs, each with a real screenshot, its current status and a link to the app.';
  const ld = {
    '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Pathway Devs apps', url: abs('/apps/'),
    hasPart: data.live.map((a) => ({ '@type': 'WebPage', name: a.name, url: abs(`/apps/${a.slug}/`) })),
  };
  return head({ title, desc, canonical: '/apps/', ogImage: '/assets/og/default.jpg', extra: `    <script type="application/ld+json">${JSON.stringify(ld)}</script>\n` }) + `
<body>

${header('apps')}
    <main id="main">
    <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li aria-current="page">Apps</li></ol></nav>
    <section class="section" style="padding-top: 30px;">
        <h1 class="section-title">The <span>Bench</span></h1>
        <div class="text-container text-container-narrow" style="margin-bottom: 30px;">
            <p>
                Here is working software that we built and run ourselves.
                <br><br>
                Every app below has its own page with a real screenshot taken from the live app, its current status, a plain-words description and a link to the real thing.
            </p>
        </div>

        <div class="status-legend" aria-label="Status key">
            <span><span class="badge badge-live">Live</span> open and working today</span>
            <span><span class="badge badge-beta">Beta</span> open, still being shaped</span>
            <span><span class="badge badge-soon">Coming soon</span> not public, no date</span>
        </div>

        <h2 class="sub-title">Live</h2>
        <div class="grid" style="margin-bottom: 60px;">
${data.live.map(indexCard).join('\n')}
        </div>

        <h2 class="sub-title">Coming soon</h2>
        <div class="grid">
${data.coming.map(soonCard).join('\n')}
        </div>

        <p class="center-cta" style="color:#b3b3b3;">Want something built the way these were? <a class="inline-link" href="/#contact">Open the Contact Room</a>.</p>
    </section>
    </main>
${footer()}
    <script src="/assets/js/site.js?v=${V}" defer></script>
${TAVUS}</body>
</html>
`;
}

/* ---------------- app pages ---------------- */
const list = (arr) => arr.map((t) => `<li>${esc(t)}</li>`).join('');
const paras = (arr) => arr.map((t) => `<p>${esc(t)}</p>`).join('\n                ');

function buildApp(a) {
  const canonical = `/apps/${a.slug}/`;
  const ld = [
    {
      '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: a.name, url: a.url,
      applicationCategory: a.category, operatingSystem: 'Web', description: a.metaDesc,
      image: abs(`/assets/apps/${a.slug}.webp`), publisher: { '@type': 'Organization', name: 'Pathway Devs', url: abs('/') },
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: abs('/') },
        { '@type': 'ListItem', position: 2, name: 'Apps', item: abs('/apps/') },
        { '@type': 'ListItem', position: 3, name: a.name, item: abs(canonical) },
      ],
    },
  ];
  const others = data.live.filter((o) => o.slug !== a.slug)
    .map((o) => `<li><a href="/apps/${o.slug}/">${esc(o.name)}</a></li>`).join('');
  const dim = a.shotH ? `width="1280" height="${a.shotH}"` : 'width="1280" height="800"';
  return head({
    title: a.metaTitle, desc: a.metaDesc, canonical, ogImage: `/assets/og/${a.slug}.jpg`, ogType: 'article',
    extra: ld.map((o) => `    <script type="application/ld+json">${JSON.stringify(o)}</script>\n`).join(''),
  }) + `
<body>

${header('apps')}
    <main id="main">
    <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><a href="/apps/">Apps</a></li><li aria-current="page">${esc(a.name)}</li></ol></nav>

    <section class="app-hero">
        ${badge(a)}
        <h1>${esc(a.name)}</h1>
        <p class="lede">${esc(a.tagline)}</p>
        <div class="actions">
            <a class="cta-btn" href="${a.url}" target="_blank" rel="noopener noreferrer">Open ${esc(a.name)} &nearr;</a>
            <a class="ghost-btn" href="/apps/">All apps</a>
        </div>
        <p class="url-line">Opens ${esc(a.urlLabel)} in a new tab.</p>
    </section>

    <figure class="shot">
        <div class="shot-frame"><img src="/assets/apps/${a.slug}.webp" ${dim} alt="${esc(a.shotAlt)}" fetchpriority="high"></div>
        <figcaption>Real screenshot. ${esc(a.shotCaption)} Captured ${cfg.capturedOn} with headless Chromium. No personal data shown.</figcaption>
    </figure>

    <div class="app-body">
        <section class="panel">
            <h2>What it does</h2>
            ${paras(a.what)}
            <ul>${list(a.bullets)}</ul>
        </section>

        <div class="two-col">
            <section class="panel status">
                <h2>Status</h2>
                <p>${badge(a)}</p>
                <p style="margin-top:12px;">${esc(a.statusNote)}</p>
            </section>
            <section class="panel">
                <h2>What it is for, and how it was built</h2>
                ${paras(a.built)}
            </section>
        </div>

        <section class="panel note">
            <h2>Good to know</h2>
            ${paras(a.goodToKnow)}
        </section>
    </div>

${guidePanel(a)}    <aside class="other-apps" aria-label="Other apps">
        <h2>More from Pathway Devs</h2>
        <ul>${others}</ul>
    </aside>

    <section class="end-cta">
        <p>Want something built the way this was?</p>
        <a class="cta-btn" href="/#contact">Open the Contact Room</a>
    </section>
    </main>
${footer()}
    <script src="/assets/js/site.js?v=${V}" defer></script>
${TAVUS}</body>
</html>
`;
}


function guidePanel(a) {
  const g = guides.filter((x) => x.app === a.slug);
  if (!g.length) return '';
  return `    <aside class="other-apps" aria-label="Guides">
        <h2>Guides</h2>
        <ul>${g.map((x) => `<li><a href="/apps/${x.app}/${x.slug}/">${esc(x.linkText)}</a></li>`).join('')}</ul>
    </aside>
`;
}
function buildGuide(g) {
  const a = data.live.find((x) => x.slug === g.app);
  const canonical = `/apps/${g.app}/${g.slug}/`;
  const ld = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: abs('/') },
      { '@type': 'ListItem', position: 2, name: 'Apps', item: abs('/apps/') },
      { '@type': 'ListItem', position: 3, name: a.name, item: abs(`/apps/${a.slug}/`) },
      { '@type': 'ListItem', position: 4, name: g.h1, item: abs(canonical) },
    ],
  };
  const sec = g.sections.map((s) => `        <section class="panel">
            <h2>${esc(s.h)}</h2>
            ${s.p ? paras(s.p) : ''}${s.ol ? `<ol>${list(s.ol)}</ol>` : ''}${s.olHtml ? `<ol>${s.olHtml.map((t) => `<li>${t}</li>`).join('')}</ol>` : ''}
            ${s.cta ? `<p style="margin-top:18px;"><a class="cta-btn" href="${g.appUrl}" target="_blank" rel="noopener noreferrer">${esc(s.cta)} &nearr;</a></p>` : ''}
            ${s.phone ? `<p style="margin-top:12px;">Questions? Business: <a href="tel:2313201550">${cfg.businessPhone}</a></p>` : ''}
        </section>`).join('\n');
  return head({ title: g.title, desc: g.desc, canonical, ogImage: `/assets/og/${a.slug}.jpg`, ogType: 'article',
    extra: `    <script type="application/ld+json">${JSON.stringify(ld)}</script>\n` }) + `
<body>

${header('apps')}
    <main id="main">
    <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><a href="/apps/">Apps</a></li><li><a href="/apps/${a.slug}/">${esc(a.name)}</a></li><li aria-current="page">${esc(g.linkText)}</li></ol></nav>

    <section class="app-hero">
        <h1>${esc(g.h1)}</h1>
        <p class="lede">${esc(g.intro)}</p>
    </section>

    <div class="app-body">
${sec}
        <section class="panel note">
            <p><em>${esc(g.fine)}</em></p>
        </section>
    </div>
    </main>
${footer()}
    <script src="/assets/js/site.js?v=${V}" defer></script>
${TAVUS}</body>
</html>
`;
}

/* ---------------- policies index ---------------- */
function buildPolicies() {
  const apps = [['pathway-devs','Pathway Devs (this site)'],['llc-formation','Pathway Formation'],['autobridge','AutoBridge'],['round-table','Round Table'],['ai-reality','AI Reality'],['almost-uncensored-tv','Almost Uncensored TV']];
  const rows = apps.map(([s,n]) => `                <div class="card"><h3>${esc(n)}</h3><p><a class="inline-link" href="/policies/${s}/privacy.html">Privacy</a> &middot; <a class="inline-link" href="/policies/${s}/terms.html">Terms</a> &middot; <a class="inline-link" href="/policies/${s}/cookies.html">Cookies</a></p></div>`).join('\n');
  return `${head({ title: 'Policies | Pathway Devs', desc: 'Privacy, terms and cookie policies for Pathway Devs and its apps.', canonical: '/policies/', ogImage: '/assets/og/default.jpg' })}
<body>
${header('')}
    <main>
        <section class="section">
            <h1 class="section-title">Our <span>Policies</span></h1>
            <div class="text-container text-container-narrow" style="margin-bottom: 30px;"><p>Privacy, terms and cookie policies for this site and each app we run. Questions go to <a class="inline-link" href="mailto:support@pathwaydevs.org">support@pathwaydevs.org</a>.</p></div>
            <div class="grid">
${rows}
            </div>
        </section>
    </main>
${footer()}
    <script src="/assets/js/site.js?v=${V}" defer></script>
${TAVUS}</body>
</html>
`;
}

/* ---------------- sitemap + robots ---------------- */
function buildSitemap() {
  const urls = ['/', '/apps/', '/policies/', '/privacy.html', '/terms.html', '/cookies.html', ...data.live.map((a) => `/apps/${a.slug}/`), ...guides.map((g) => `/apps/${g.app}/${g.slug}/`)];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>\n    <loc>${abs(u)}</loc>\n    <lastmod>${cfg.lastmod}</lastmod>\n  </url>`).join('\n')}
</urlset>
`;
}

// Image heights (for width/height attributes so layout does not jump).
import { execFileSync } from 'node:child_process';
for (const a of data.live) {
  try {
    const out = execFileSync('python3', ['-c', `from PIL import Image;print(Image.open(r'${path.join(root, 'assets/apps', a.slug + '.webp')}').height)`]).toString().trim();
    a.shotH = Number(out);
  } catch { /* falls back to 800 */ }
}

write('index.html', buildHome());
write('apps/index.html', buildAppsIndex());
for (const a of data.live) write(`apps/${a.slug}/index.html`, buildApp(a));
for (const g of guides) write(`apps/${g.app}/${g.slug}/index.html`, buildGuide(g));
write('policies/index.html', buildPolicies());
write('sitemap.xml', buildSitemap());
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${abs('/sitemap.xml')}\n`);
console.log(`built ${2 + data.live.length} pages; public name: ${legal}`);
