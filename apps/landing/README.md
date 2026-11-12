# landing

The ngdiagram.dev home page and contact page: a static Astro site.

- **`/`** introduces ngDiagram: what it is, how to start, the templates, examples and resources,
  the team behind it, and an FAQ. Its hero runs the docs example "Landing Page Diagram" live.
- **`/contact`** is the form for consulting and support requests. It sends messages to HubSpot.

## How it works

- **Static pages.** `astro build` writes `dist/index.html`, `dist/contact/index.html` and the
  assets under `dist/_landing/`. The `_landing` prefix lets a proxy serve the pages next to the
  docs.
- **The live hero diagram.** The hero is a small Angular application, compiled ahead of time by
  `@analogjs/vite-plugin-angular`.
  - It reuses the node components of the docs example
    (`apps/docs/src/components/angular/examples/landing-page-diagram/`) and builds against
    `packages/ng-diagram/dist`.
  - It loads only in desktop windows with a fine pointer, once the page is idle. While it loads,
    an SVG sketch of the diagram fills its place.
  - Everywhere else (phones, touch devices, short windows) a still image of the diagram stands in.
- **Content and styles.**
  - Copy lives in `src/data/`. Settings live in `src/config/`: the site URL, links, the hero's
    media query, the HubSpot form and the analytics IDs.
  - One global stylesheet in cascade layers (`src/styles/`): the design mockup's rules first,
    then the intentional differences listed in [DEVIATIONS.md](./DEVIATIONS.md).
- **Interactions.** The menu, tabs, copy buttons, video dialog and contact form are small
  TypeScript modules in `src/scripts/`. Without JavaScript the content stays readable, and the
  contact form points to Discord instead.
- **Analytics.** Only a build with `LANDING_ANALYTICS=true` loads the site's analytics. Other
  builds, including local ones and CI, load nothing from other hosts.

## Run it

Requires Node 22.23.4 or later.

```sh
pnpm --filter ng-diagram build              # the hero builds against packages/ng-diagram/dist
pnpm --filter landing dev                   # http://localhost:4321
pnpm --filter landing build
pnpm --filter landing preview --port 4329
```

## Test it

```sh
pnpm --filter landing test:e2e   # Playwright: layout, accessibility, keyboard, hero, contact form, structured data
pnpm --filter landing perf       # Lighthouse budgets, against the preview on port 4329
```

The tests never send anything to HubSpot. `pnpm --filter landing parity` compares the pages with
the design mockup, which is not part of this repository.

## When the docs example changes

The sketch and the still image of the hero are generated from the live diagram. After a change
to the docs example "Landing Page Diagram", build the landing, start the preview, and run:

```sh
pnpm --filter landing sketch:capture
pnpm --filter landing still:capture
```

`tests/hero.spec.ts` fails while the sketch differs from the live diagram.
