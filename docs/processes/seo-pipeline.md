# SEO Pipeline

## Overview

On every ng-diagram release, the docs (Starlight) SEO files are generated and handed to the dedicated `synergycodes/seo-ngdiagram` repo, which merges them with the manually maintained main-site (Webflow) sources and produces a deployment artifact.

The pipeline is split across two repos so each owns one responsibility:

| Stage | Repo          | Responsibility                               | Workflow         |
| ----- | ------------- | -------------------------------------------- | ---------------- |
| 1     | ng-diagram    | Generate & push the docs SEO files           | `deploy-seo.yml` |
| 2     | seo-ngdiagram | Merge docs + main-site files, build artifact | `merge-seo.yml`  |

VM/Nginx deployment consumes the artifact and is handled separately.

## Stage 1 — Generate & push (ng-diagram)

Workflow: `.github/workflows/deploy-seo.yml` — triggered on push to `release` and via `workflow_dispatch`.

1. Build the docs: `pnpm run docs:build` → `apps/docs/dist`
2. Copy the three generated files into the `seo-ngdiagram` clone's `docs/`:
   - `apps/docs/dist/docs/sitemap-0.xml` → `docs/sitemap-0.xml`
   - `apps/docs/dist/llms.txt` → `docs/llms.txt`
   - `apps/docs/dist/llms-full.txt` → `docs/llms-full.txt`
3. Commit & push only if `docs/` changed; message references the ng-diagram SHA.

No merge happens here. `robots.txt` is not pushed — the main-site `robots.txt` is canonical for the whole domain.

## Stage 2 — Merge & build (seo-ngdiagram)

Workflow: `.github/workflows/merge-seo.yml` — triggered by the Stage 1 push and via `workflow_dispatch`.

```bash
node scripts/merge-seo.js --docs docs --website website --out dist
```

The merged `dist/` is uploaded as the `seo-dist` artifact — nothing is committed back, so each Stage 1 push triggers exactly one merge run (no loop).

Merge rules (pure Node, no deps, idempotent):

- **sitemap.xml** — parse `<loc>` from both sitemaps, normalize host to `ngdiagram.dev` (strip `www.`, force https), dedupe, emit one flat `<urlset>` (main-site first, then docs). Preserve `<lastmod>`.
- **robots.txt** — `website/robots.txt` is canonical; force `Sitemap:` → `https://ngdiagram.dev/sitemap.xml`.
- **llms.txt** — docs base; inject `website/llms.txt` as a section before the first `## ` heading.
- **llms-full.txt** — docs base; insert `website/llms-full.txt` after the header `---` separator.

## Configuration

- **Canonical domain**: `https://ngdiagram.dev` (non-www).
- **Stage 1 push auth**: SSH deploy key secret `SEO_DEPLOY_KEY` in ng-diagram.
- **Output**: GitHub Actions artifact `seo-dist` from Stage 2.
- **seo-ngdiagram layout**: `docs/` (auto-pushed, generated), `website/` (human-edited Webflow sources), `scripts/merge-seo.js`, `.github/workflows/merge-seo.yml`.

> **Testing**: both stages currently target branch `NGD-142` on `seo-ngdiagram`. Switch both to `main` once verified end-to-end (Stage 1 push → Stage 2 merge → download `seo-dist`, check valid XML, non-www, deduped URLs, llms sections present).

## Related

- [Release Process](./release-process.md)
- [Maintaining Documentation](./maintaining-documentation.md)
