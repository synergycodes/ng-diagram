# SEO file merge & sync pipeline (NGD-142)

## Goal

On every ngDiagram release, generate the docs (Starlight) SEO files and hand them
to the dedicated repo `synergycodes/seo-ngdiagram`, which merges them with its
manually maintained main-site (Webflow) source and produces a deployment artifact.
VM/proxy deployment is a separate task that consumes that artifact.

## Architecture — two-stage, two-repo pipeline

The work is split across the two repos so each owns one responsibility:

### Stage 1 — ng-diagram: generate & push docs SEO files

Workflow `.github/workflows/deploy-seo.yml`, `on: push: branches: [release]` +
`workflow_dispatch`. Steps:

1. checkout ng-diagram
2. setup node/pnpm (`run_install`)
3. `pnpm run docs:build` → `apps/docs/dist`
4. SSH agent via `SEO_DEPLOY_KEY`
5. `git clone --branch NGD-142 git@github.com:synergycodes/seo-ngdiagram.git`
6. copy the three generated docs SEO files into the clone's `docs/`:
   - `apps/docs/dist/docs/sitemap-0.xml` → `docs/sitemap-0.xml`
   - `apps/docs/dist/llms.txt` → `docs/llms.txt`
   - `apps/docs/dist/llms-full.txt` → `docs/llms-full.txt`
7. commit & push to seo `NGD-142` only if `docs/` changed; message references ng-diagram sha.

No merge or `dist/` build happens here. The docs `robots.txt` is not pushed —
the main-site `robots.txt` is canonical for the whole domain.

### Stage 2 — seo-ngdiagram: merge & build artifact

Workflow `.github/workflows/merge-seo.yml`, `on: push: branches: [NGD-142]` +
`workflow_dispatch`. Steps:

1. checkout seo-ngdiagram
2. setup node
3. `node scripts/merge-seo.js --docs docs --website website --out dist`
4. `actions/upload-artifact` the `dist/` output as `seo-dist`

No commit-back, so the push from Stage 1 triggers exactly one merge run (no loop).

## Locked decisions

- **Stage 1 trigger**: push to ng-diagram `release` (same signal as docs production deploy) + `workflow_dispatch`.
- **Stage 2 trigger**: push to seo-ngdiagram `NGD-142` (testing) + `workflow_dispatch`.
- **Canonical domain**: `https://ngdiagram.dev` (non-www). Main-site `www.` URLs are normalized.
- **Sitemap**: single flattened `sitemap.xml` (all docs + main-site URLs in one `<urlset>`).
- **Stage 1 push auth**: SSH deploy key secret (`SEO_DEPLOY_KEY`) in ng-diagram.
- **Deployment output**: GitHub Actions artifact (`seo-dist`) from Stage 2 — nothing committed back to the repo.
- **Testing branch**: `NGD-142` on seo-ngdiagram (Stage 1 pushes there, Stage 2 triggers there). Switch both to `main` once verified.

## seo-ngdiagram repo layout

```
seo-ngdiagram/
├── docs/               # auto-pushed from ng-diagram (generated docs SEO files)
│   ├── sitemap-0.xml
│   ├── llms.txt
│   └── llms-full.txt
├── website/            # manually maintained Webflow source (humans edit here)
│   ├── sitemap.xml     # main-site page URLs
│   ├── robots.txt      # canonical bot policy for the whole domain
│   ├── llms.txt        # main-site section fragment
│   └── llms-full.txt   # main-site full content
├── scripts/
│   └── merge-seo.js    # merge logic (moved here from ng-diagram)
└── .github/workflows/merge-seo.yml
```

The merged output (`dist/`) is produced in CI and uploaded as an artifact; it is
not committed to the repo.

## Merge logic — `scripts/merge-seo.js` (pure Node, no deps)

`node scripts/merge-seo.js --docs <dir> --website <dir> --out <dir>`

- `--docs` reads `sitemap-0.xml`, `llms.txt`, `llms-full.txt` (flat, as pushed from ng-diagram).
- `--website` reads `sitemap.xml`, `robots.txt`, `llms.txt`, `llms-full.txt`.
- **sitemap.xml**: parse `<loc>` from both sitemaps, normalize host to `ngdiagram.dev`
  (strip `www.`, force https), dedupe, emit one flat `<urlset>` (main-site first, then docs).
  Preserve `<lastmod>` where present.
- **robots.txt**: `website/robots.txt` is canonical; force `Sitemap:` →
  `https://ngdiagram.dev/sitemap.xml`.
- **llms.txt**: docs `llms.txt` base; inject `website/llms.txt` as a section before the first `## ` heading.
- **llms-full.txt**: docs base; insert `website/llms-full.txt` right after the header `---` separator.

Fully derived from inputs each run (no appends) → idempotent.

## Testing

Branch `NGD-142` in `seo-ngdiagram` carries the new layout, script, and workflow.
End-to-end: a Stage 1 run (or manual `workflow_dispatch`) pushes docs files →
triggers Stage 2 → download the `seo-dist` artifact and verify merged files
(valid XML, non-www, deduped URLs, llms sections present).

## Out of scope

VM deployment, Nginx config, Webflow auto-SEO disabling (handled separately by Jakub Kubacki).
