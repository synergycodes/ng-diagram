# SEO file merge & sync pipeline (NGD-142)

## Goal

On every ngDiagram release, automatically generate merged SEO files (`llms.txt`,
`llms-full.txt`, `sitemap.xml`, `robots.txt`) covering both the docs (Starlight)
and the main site (Webflow), then push the final files to the dedicated repo
`synergycodes/seo-ngdiagram`. VM/proxy deployment is a separate task that pulls
from that repo.

## Locked decisions

- **Trigger**: push to the `release` branch (same signal as the docs production deploy).
- **Canonical domain**: `https://ngdiagram.dev` (non-www). Main-site `www.` URLs are normalized.
- **Sitemap**: single flattened `sitemap.xml` (all docs + main-site URLs in one `<urlset>`).
- **Push auth**: fine-grained PAT secret (`SEO_REPO_TOKEN`) scoped to `seo-ngdiagram` (contents: write).
- **Output location**: `dist/` in the seo repo (clean source/output split). CI overwrites wholesale.
- **Push style**: direct commit/push to seo `main` (skip empty commits).

## Current state (discovered)

- `apps/docs` is Starlight/Astro (`site: https://ngdiagram.dev`, `base: /docs`).
  Build = `sync-changelog.js` → `generate-llms.js` → `astro build` → `post-build.js`.
  - `generate-llms.js` writes `public/llms.txt` + `public/llms-full.txt` (base `https://ngdiagram.dev/docs`).
  - Starlight + `@astrojs/sitemap` emit `sitemap-index.xml` + `sitemap-0.xml`.
  - `post-build.js` restructures everything under `dist/docs/`, copies `llms.txt`,
    `llms-full.txt`, `robots.txt` to the domain root (`dist/`).
- `seo-ngdiagram` repo currently holds root-level `robots.txt` (full bot policy,
  references `www.ngdiagram.dev/sitemap.xml`), `sitemap.xml` (3 main-site URLs, www),
  and empty `llms.txt` / `llms-full.txt`.

## seo-ngdiagram repo layout (target)

```
seo-ngdiagram/
├── main-site/          # manually maintained Webflow source (humans edit here)
│   ├── sitemap.xml     # main-site page URLs
│   ├── robots.txt      # canonical bot policy for the whole domain
│   ├── llms.txt        # main-site section fragment
│   └── llms-full.txt   # main-site full content
├── dist/               # auto-generated merged output (CI commits here; VM serves this)
│   ├── sitemap.xml
│   ├── robots.txt
│   ├── llms.txt
│   └── llms-full.txt
└── README.md
```

Migration: existing root `robots.txt` + `sitemap.xml` move into `main-site/` and become
the source of truth; `www.` URLs and the `Sitemap:` line corrected to `ngdiagram.dev`;
empty llms files get real main-site content.

## Merge logic — `apps/docs/scripts/merge-seo.js` (pure Node, no deps)

`node scripts/merge-seo.js --docs-dist <dir> --main-site <dir> --out <dir>`

- **sitemap.xml**: parse `<loc>` from docs `sitemap-0.xml` + `main-site/sitemap.xml`,
  normalize host to `ngdiagram.dev` (strip `www.`, force https), dedupe, emit one flat
  `<urlset>` (main-site first, then docs). Preserve `<lastmod>` where present.
- **robots.txt**: `main-site/robots.txt` is canonical; force `Sitemap:` →
  `https://ngdiagram.dev/sitemap.xml`. Union any extra rules from docs `robots.txt`.
- **llms.txt**: docs `llms.txt` base; inject `main-site/llms.txt` as a `## Main Site`
  section after the intro links.
- **llms-full.txt**: docs base; prepend a `# Main Site` section from `main-site/llms-full.txt`
  after the header block.

Fully derived from inputs each run (no appends) → idempotent.

## CI workflow — `.github/workflows/deploy-seo.yml`

`on: push: branches: [release]` + `workflow_dispatch`. Steps:

1. checkout ng-diagram
2. setup node/pnpm + `pnpm install --frozen-lockfile`
3. `pnpm run docs:build` → `apps/docs/dist`
4. checkout `synergycodes/seo-ngdiagram` into a subdir via `SEO_REPO_TOKEN`
5. `node apps/docs/scripts/merge-seo.js --docs-dist apps/docs/dist --main-site seo/main-site --out seo/dist`
6. commit & push to seo `main` only if `dist/` changed; commit message references ng-diagram sha.

## Testing

Branch `NGD-142` in `seo-ngdiagram` with the new layout; run merge locally against a real
`docs:build`; verify merged `dist/` files (valid XML, non-www, deduped URLs, llms sections present).

## Documentation

README in `seo-ngdiagram` (layout, maintaining `main-site/`, dist/ is generated) + a note
in ng-diagram about the workflow.

## Out of scope

VM deployment, Nginx config, Webflow auto-SEO disabling (handled separately by Jakub Kubacki).
