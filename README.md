# ARGE FC

Website for **ARGE FC**, a football club founded by a collective of small
architecture offices to compete in the Basel S AM Cup.

🌐 [argefc.com](https://argefc.com/)

## About

A static site — plain HTML, CSS and vanilla JavaScript, no build step,
no framework, no dependencies. Deployed via GitHub Pages on a custom
domain.

## Project structure

```
.
├── index.html          Splash / entry page
├── home.html            Main page: about, offices, friends, editions
├── 404.html              Custom error page
├── bee.js                Decorative flying-bee animation (home.html)
├── script.js              Splash page entry animation (index.html)
├── 404.js                  404 page exit animation + auto-redirect
├── style.css / home.css / edition.css / 404.css
├── resources/              Shared assets (logo, icons, OG image)
├── CNAME                    Custom domain config for GitHub Pages
├── .nojekyll                Disables Jekyll processing on GitHub Pages
├── robots.txt / sitemap.xml  Crawler config
└── 2022/ 2023/ 2024/ 2025/  One folder per S AM Cup edition, each with
                             its own edition<year>.html page and photo(s)
```

Each edition page (`/2022/`, `/2023/`, …) follows the same template:
a back-link to `home.html`, the edition title, a team photo, and a short
note. Winning editions additionally get a confetti animation
(`body.is-winner`).

## Local development

No build step — just serve the folder:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`. Note: the local server won't emulate
GitHub Pages' automatic `404.html` handling for unmatched routes — open
`/404.html` directly to check that page.

## Deployment

Pushing to `main` deploys automatically via GitHub Pages. The `CNAME`
file points the custom domain (`argefc.com`) at the repo.

⚠️ `CNAME` gets silently wiped if GitHub Pages is ever disabled/re-enabled
or the repo is recreated — if that happens, re-add a file named `CNAME`
containing `argefc.com` and re-set the custom domain in the repo's Pages
settings.

## Credits

Visual identity and teamwear by [Studio Bosco Ferreira](https://www.boscoferreira.com/).
Website by [SUPERFLUO](https://superfluo.cc/).
