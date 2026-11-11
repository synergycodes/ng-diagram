# landing

The ngdiagram.dev landing page: a static Astro site. The hero shows the live docs example
"Landing Page Diagram" as a small Angular application that loads only for desktop visitors.

The visual source of truth is mockup V7: the marketing review of 2026-11-10 (`index.html` with
`img/` and `widget/`), which is mockup V6 with new copy and five new sections. Its comments show
with the page; `?clean` in the address hides them. The contact page follows the review's contact
mockup.

```sh
pnpm --filter ng-diagram build   # the hero compiles against packages/ng-diagram/dist
pnpm --filter landing dev        # http://localhost:4321
pnpm --filter landing build
pnpm --filter landing preview
```

Requires Node 22.23.4 or later (Astro 7).

## Hero diagram

- `src/components/HeroDiagram.astro` renders the host and a small loader. The loader imports
  `src/hero/bootstrap.ts` only when `HERO_DIAGRAM_MEDIA` (`src/config/hero.ts`) matches, the
  visitor has not turned on Save-Data, and the page has finished loading and is idle. Phones,
  touch devices and very short windows never download the diagram code or its styles.
- `src/hero/bootstrap.ts` starts Angular with `createApplication` and creates
  `HeroDiagramComponent`. It injects the diagram's global styles (`hero-global.css`: the
  library styles, uPlot styles, and the five Phosphor icons as CSS masks) only at that moment.
- `src/hero/hero-diagram.component.ts` renders the diagram over the whole hero and fits its
  content into `.hero-stage`, also on every resize. The node components and data come from
  `apps/docs/src/components/angular/examples/landing-page-diagram/`.
- Angular, TypeScript, rxjs and zone.js have the same versions as `apps/docs`, so the docs
  example files and this app use one copy of Angular.
- Until the diagram is live, `src/components/HeroSketch.astro` draws a sketch of it in
  `.hero-stage` (O13), with no script. Its viewBox is the rectangle the island fits, so the live
  diagram fades in exactly on top of it. The data, `src/data/hero-sketch.ts`, is generated from
  the live diagram: after every change of the docs example, build, start the preview and run
  `pnpm --filter landing sketch:capture`. `hero.spec.ts` fails while the two differ by more than
  1px. The chart line cannot be measured (uPlot draws it on a canvas), so the capture script
  keeps a copy of the example's sample data.
- Where the live diagram does not run (phones, touch devices, short windows, Save-Data, a failed
  load, no JavaScript), the stage shows a still image of it (O7): `src/assets/hero-still.png`,
  the live diagram at its natural size, 2x, on a transparent background. It is generated too:
  after every change of the docs example, also run `pnpm --filter landing still:capture`
  (`scripts/capture-hero-still.mjs`). The page serves it as a 900px AVIF (about 23 KB) with a
  WebP fallback (`src/data/hero-still.ts`) and preloads the AVIF only where the still shows
  (`HERO_STILL_MEDIA`), because on phones it is the largest element of the first screen and
  decides the mobile LCP budget. On phones the stage takes the still's proportions.

### Build notes

- `@analogjs/vite-plugin-angular` turns Vite's TypeScript transform off unless `vite.oxc` is set.
  `astro.config.mjs` keeps it on for everything except the Angular sources.
- The plugin defines `ngServerMode` from `build.ssr` for the whole config. Astro builds the
  server and browser environments from one config, so the browser bundle got
  `ngServerMode = true` and Angular stopped with NG0401. A small plugin in `astro.config.mjs`
  sets the value per environment.
- A plain CSS import in the island makes Astro link that stylesheet from every page head.
  The island imports its global CSS with `?inline` and injects it on mount.

## Spike result (2026-11-04)

Stack: Astro 7.4.5 (Vite 8.3.5), `@analogjs/vite-plugin-angular` 2.9.6, Angular 19.2.25,
`@angular/build` 19.2.27, TypeScript 5.8.3. Resolved from the plugin directory:
`@angular/compiler-cli` 19.2.25, `typescript` 5.8.3, `vite` 8.3.5 (the same instance as Astro's).

Result: GO.

- `astro dev`, `astro build` and `astro check` pass.
- The diagram renders with icons and the uPlot chart, nodes drag, no watermark.
- One copy of Angular in the bundle, no `@angular/compiler` (AOT).
- The content stays inside `.hero-stage` after resizing 1440 → 1100 → 1440 px.
- The diagram is no Tab stop (`tabindex="-1"`). After clicking a node, arrow keys scroll the
  page and Delete removes nothing. Ctrl + wheel over the hero is not cancelled and does not
  scale the diagram.
- Island chunk: 178.7 KB gzip (JS with the injected CSS). Page script: 1.4 KB gzip.
- At 390 px, with a touch screen at 1440 px, and in a 1280 × 500 window: zero requests for the
  island JS or CSS.
- Long tasks during the hero bootstrap at 1440 × 900 (Chromium, after `load` and idle): none
  without CPU throttling; 59, 169, 154 and 70 ms with 4× CPU throttling.
- `pnpm install --frozen-lockfile` of the whole workspace passes on Node 22.12.0 (the docs
  deploys install on Node 22).

## Styles

`src/styles/global.css` declares `@layer tokens, mockup, deviations, pages`. `mockup/*.css` are the mockup's
rules without comments, in their original order (breakpoints in `em`: 64em, 45em, 23.75em).
Mockup V7 added `mockup/scroller.css` (the paging row of the Engineering templates and the
resources) and `mockup/sections-v7.css` (the project facts band, "What is ngDiagram?", the FAQ,
the template ask and the resources, at the end of the sheet as in the mockup), and moved the
top padding of `#examples` back to 100px.
`deviations/*.css` hold every intentional difference, listed below. `pages/*.css` hold pages the
mockup does not have; each is imported by its page and repeats the full layer order at its top,
because it can load before `global.css`. Components render the mockup's class names and have no
scoped styles.

Dead rules were removed after the port: 23 selectors that match no element in any state, in
the mockup or here (`.assist`, `.muted`, `.mono`, `.tpl-lg`, `.domain-tag`, `.comm-links`, and
descendant rules such as `.tpl-desc a` or `.talk-act small`). Found by stripping state
pseudo-classes from every selector and querying the page; state rules (`:hover`, `.nav-open`,
`.copy.done`, `data-state`, forced colours) and slot rules (`.hero--still`, `.services-photo`)
stay.

## Interactions

Plain TypeScript in `src/scripts/`, loaded by the component that renders the markup. Without
JavaScript the `noscript` styles in `Layout.astro` list every template panel, hide the tabs,
the package manager segment and the copy buttons, and show the menu as a static list up to 64em.

- `nav.ts` (`SiteHeader`): `aria-expanded`, `nav-open` on `header`, no page scroll and `inert`
  on `main`, `footer` and the skip link while open. Escape closes and focuses the button; any
  link in the header closes; growing past 64em closes.
- `tabs.ts` (`Templates`) and `package-manager.ts` (`QuickStart`): one Tab stop per group
  (`roving.ts`), arrows move and select (tabs: left/right; segment: all four), Home/End.
- `code-blocks.ts` (`QuickStart`): copy says "Copied" only after a real copy; when the
  clipboard is blocked the code is selected and the instruction is announced. One polite live
  region (`announce.ts`, rendered by `Layout`), emptied before each message. A `<pre>` is a Tab
  stop only while it scrolls sideways (`ResizeObserver`, font load, command change).
- `scroller.ts` (`RowScroller`: the Engineering templates and the resources): a real
  horizontal scroller with three cards and a part of the fourth; the two buttons below page by
  the visible width, are `aria-disabled` at the ends, and the settled position ("Templates 2–4
  of 4") goes to the live region. A card that takes focus scrolls to the start. A skip link
  leads to the buttons. Below 45em the buttons and the skip link go. `tabs.ts` measures a row
  again when its panel is shown.
- `video-lightbox.ts` (`Resources`): the videos play in a native modal `<dialog>` on the
  page. The controls are links to the video on YouTube (so they work without JavaScript); the
  script gives them the button role and Space. The player (`youtube-nocookie.com`) is created on
  open and removed on close; nothing from YouTube loads before a click. Escape, the close button
  and a click beside the player close it; focus returns to "Watch here".
- The FAQ is native `<details>`, without a script.
- The only script that scrolls the page is the contact form's, to the top of the confirmation,
  instantly; reduced motion is otherwise handled in CSS (`deviations/a11y.css`).

## Contact page

`/contact` (`src/pages/contact.astro`) replaces the Webflow page at ngdiagram.dev/contact. It
follows the marketing review of 2026-11-10: intro, form, community block, a line on Synergy
Codes, footer, in one centred column; once sent, a confirmation page replaces all of it. The
page has an `h1` (production has only `h2`s).

- **Structure.** `ContactIntro` (the `h1` "Consulting for large-scale ngDiagram projects", the
  production lead with the 24-hour promise, a signpost to Discord for usage questions),
  `ContactSent` (hidden until sent), `ContactForm`, `ContactCommunity` ("ngDiagram community",
  "Join Discord" as a secondary button), then one quiet line: who develops ngDiagram (15+ years,
  200+ solutions). The intro and the confirmation share the hero's backdrop (two purple glows,
  the dot grid, edges fading into the page). Header and footer get `current="contact"` (O14).
  Title and description are the review's; the canonical URL is
  `https://www.ngdiagram.dev/contact` (no trailing slash, set through the `canonical` prop of
  `Layout`). `astro build` writes `dist/contact/index.html`.
- **Form as the Quick Start rail.** The form reuses the rail's classes (`.qs-rail`, `.qs-steps`,
  `.step`, `.num`, `.step-body`, `.qs-end`) and adds `contact-*` classes for its states in
  `styles/pages/contact.css`; the rail's rules needed no override beyond colours. Two numbered
  steps (About you: full name, company, work email; Your project), each with "All fields are
  required.", then the rail's end mark beside the marketing consent, the GDPR text and the
  button. A step's square and segment turn purple while its fields are valid (decoration only,
  `aria-hidden`, never an error). While sending, a light runs down the rail to the end mark,
  which pulses purple. Reduced motion: no transitions and no running light.
- **Fields.** Labels above the fields, "All fields are required." under each step's title (the
  fields have `required`), hints instead of placeholders ("Only company domains are supported.", the project
  prompt). Field borders `--field-line` are 3.7:1 against `--bg` and 3.6:1 against the field
  fill `--panel-2` (WCAG 1.4.11). Errors use `--warn` (the mockup's amber) with the warning icon
  and text, `aria-invalid` and `aria-describedby` (hint and error). Chrome's autofill keeps the
  dark field. The marketing checkbox is a native input (`appearance: none`, native again in
  forced colours); its "Privacy policy" sentence and "(Optional)" are outside the label and
  linked with `aria-describedby`. Both privacy links lead to `LINKS.privacy` (production:
  `href="#"`). The consent text says "at any time"; HubSpot stores only the checkbox value.
- **Validation** (`scripts/contact-validation.ts`). Values are trimmed. A field is checked on
  blur once the visitor changed it and on every input once it shows an error; a press on the
  button skips the blur check (the inserted error would move the button away from the
  pointer). Sending checks every field and focuses the first invalid one. Email: a dot in the
  domain, and no free provider from `data/contact.ts` (exact domains, plus the regional
  domains of yahoo, hotmail, outlook, live, gmx and yandex). With JavaScript the form has
  `novalidate`.
- **Sending** (`scripts/contact-form.ts`). HubSpot Forms API v3, unauthenticated submit, one
  `fetch` with JSON, no HubSpot script, no cookies, no `hutk`. Configuration in
  `config/contact.ts`: the portal ID and the form GUID (without them the build warns once and
  the form shows its general error and logs why), and the form's field names: `full_name` (the
  full name as typed), `company`, `email`, `message`, and `privacy_policy` (the optional
  marketing checkbox, sent as `true` or `false`). No consent options are sent; the GDPR text is
  on the page. Context: `pageUri` and `pageName` only. The endpoint is rendered into
  `data-endpoint` and read when sending. HubSpot's `inlineMessage` and `redirectUri` are
  ignored.
- **States** (`data-state` on `[data-contact]`): `idle`, `sending` (button `aria-disabled`, form
  `aria-busy`, fields read-only, a second send is ignored, 15 s timeout), `sent` (the form gets
  `inert` and `aria-hidden`; every `[data-contact-hide]` element is hidden and `ContactSent`
  shows: "Thanks – we'll be in touch within 24 hours", the reply address, and three next steps
  (documentation, examples, Discord); the page goes to the top and focus moves to its heading),
  `failed` (a `role="alert"` block above the button,
  the data stays, sending again works). HubSpot 400 errors: `INVALID_EMAIL`, `BLOCKED_EMAIL` and
  `INVALID_DOMAIN` go to the email field, `REQUIRED_FIELD` to its field when the message names
  it; every other type (form configuration) shows the general error and logs the type. 429 has
  its own message; network errors and the timeout show the general error.
- **Hidden field.** An extra text field (`website`) is off screen, `aria-hidden` and out of the
  Tab order. When it is filled the form shows success and sends nothing.
- **Without JavaScript** the form shows with `method="post"` (nothing in the URL), the button is
  hidden by `html:not(.js)` and rendered `disabled` (Enter cannot post), and a line points to
  Discord instead.
- **Serving.** `/contact` is served from `contact/index.html` without a redirect to
  `/contact/`, since the canonical URL has no trailing slash.

## Analytics

Off unless the build sets `LANDING_ANALYTICS=true` (an `astro:env` boolean, declared as an env
input of the Turbo build task). Only the production build sets it. Local builds, previews, CI and
the tests load nothing from another host, and the budgets of `scripts/perf.mjs` measure the page
without third-party tags.

```sh
LANDING_ANALYTICS=true pnpm run landing:build
```

- **On:** `Layout` renders `components/Analytics.astro` in `<head>`. It starts loading the
  consent manager (Piwik PRO), then Google Tag Manager (both use `window.dataLayer`), then the
  Leadfeeder tracker; all three load asynchronously. The tag manager's `<noscript>` frame opens
  `<body>`. The IDs are in `config/analytics.ts`. Consent is handled by the consent manager and
  the container; the page adds no consent defaults of its own.
- **Contact form:** once HubSpot accepted a message, `scripts/contact-form.ts` pushes
  `{ event: 'contact_form_submit' }` (`CONTACT_SENT_EVENT`) to `window.dataLayer`. A failed send
  or the hidden field pushes nothing. The form sends by `fetch`, so the tag manager's own form
  triggers never see it; a tag that counts sent messages listens for this event.

## Tests

Playwright against `astro preview` (build first). Chromium only.

```sh
pnpm --filter landing build
pnpm --filter landing test:e2e      # layout, a11y, keyboard, hero, contact (CI job `landing`)
MOCKUP_PATH=<path to the mockup V7 index.html> pnpm --filter landing parity   # local only
pnpm --filter landing preview --port 4329   # then, in another terminal:
pnpm --filter landing perf          # Lighthouse budgets, median of RUNS (default 3)
LANDING_URL=http://localhost:4329/contact pnpm --filter landing perf   # the contact page
```

`layout`, `a11y` and the menu tests of `keyboard` run on both pages (`PAGES` in `support.ts`).

- `layout.spec.ts`: 20 widths from 320 to 2560px: no horizontal overflow of the page or of a
  flex row, the bar at most 72px (the header adds a 1px border), no word broken in a tab name;
  the same with WCAG 1.4.12 text spacing, and with a 200% default font from 640px (20em, the
  1.4.10 reflow width); at 1280 x 720 and 1366 x 768 the stage and the hero buttons are in the
  first screen; at 1440 x 900 step 1 of the contact form is.
- `a11y.spec.ts`: axe (WCAG 2.0/2.1/2.2 A and AA) at 390, 768, 1024 and 1440px, with the menu
  open, on every template tab, and with every FAQ answer and the video dialog open.
- `keyboard.spec.ts`: skip link, no Tab stop in the diagram, arrows and Delete after a node
  click, Ctrl + wheel, the menu, tabs, the Engineering row (paging, ends, position message, skip
  link), the video dialog (Space, focus in and back, Escape, the player removed), the FAQ,
  segment, copy (success and blocked clipboard), code block Tab stops, the page without
  JavaScript.
- `hero.spec.ts`: the diagram stays inside the stage across resizes; loading it changes nothing
  else on the page; no island requests on a phone, a touch tablet and a short window, where the
  still shows and the sketch does not; a failed load shows the still and leaves the rest
  working. The loading sketch shows and moves while the island loads (the still does not), goes
  once it is live, and has the live nodes' boxes (±1px at 1440, 1100 and 1920px); with reduced
  motion it does not move and goes at once; in forced colours it is not drawn. Without
  JavaScript the desktop hero shows the still. At 390px the stage has the still's proportions.
- `contact.spec.ts`: every request to `api.hsforms.com` is intercepted (aborted unless the test
  answers it), so no test reaches HubSpot; without IDs in the build the tests set a dummy
  `data-endpoint`. Validation (empty form, re-check on input, blur only after a change, free
  providers, format, length limits, counter, the rail's done steps), sending (the request body:
  the form's fields, the marketing box checked and not, context, no consent options; the
  confirmation; the `dataLayer` event, once per accepted message and never for a failure or the
  hidden field; 400 field and general
  errors; 429; network error and retry; busy state and no second request; no endpoint), axe in
  the error, general error and success states, keyboard (Tab order, Enter sends, Space checks,
  "Talk to the team" leads to the form), the page without JavaScript, no external request on
  load, the canonical URL, the contact links of the landing (O14), and the link rule on both
  pages (O10).
- `parity.spec.ts`: mockup V7 (`file://` with `?clean`, same local fonts, external hosts
  blocked, its diagram widget never defined) against the landing (island held back) at the 20
  widths, with reduced motion and a classic scrollbar: section heights, boxes of headings, text,
  buttons, cards and list items relative to their section, and computed type and colour styles;
  also the open menu and every package manager (not the template tabs: two domains against the
  mockup's three, O2). Every difference must match an entry of `RULES`, which names its register
  item. Reports and section screenshots go to `reports/parity/`.
- `scripts/perf.mjs`: Lighthouse 13.6.0, mobile and desktop presets, budgets of the plan:
  scores, LCP, CLS, TBT, no external hosts, page JS ≤ 15 KB gzip and no island on mobile, the
  island ≤ 250 KB gzip, page CSS ≤ 20 KB gzip. `astro preview` does not compress, so byte
  budgets use the gzip size of the built files.

Known limit: at 390px with a 200% default font (an effective 195px, below the WCAG reflow
width) the longest tab name ("Engineering") is clipped.

## Deviation register

Differences from the mockup (V7), on purpose. `parity.spec.ts` allows exactly these (its `RULES`).

- **O1 Navigation up to 64em:** menu button and panel instead of the three-line bar; "Talk to
  the team" stays in the bar on every width. Above 64em: fluid gaps and wrapping as a safety
  net. `scroll-padding-top` follows the header height (`--nav-h`). When the text grows (text
  spacing, a larger default font) the CTA label wraps instead of pushing the bar off screen.
- **O2 Templates:** the five real templates, no placeholders, in two domains: Engineering
  (Electric Circuit, Single-Line Diagram, AV Schematic, Assembly Line) and Business modeling
  (Org Chart). The mockup's Workflow tab is left out for now; its Assembly Line card is in
  Engineering (decided 2026-11-10). A domain with four or more templates pages them in the
  mockup's row (`RowScroller`), a smaller one is a card grid.
- **O3 StackBlitz:** the button renders only when `slots.stackblitzUrl` is set.
- **O4 Hero accessibility:** the diagram is no Tab stop, has no shortcuts, does not zoom, and its
  host is `aria-hidden`; Ctrl + wheel stays with the browser. The watermark is off by config.
  Hero text stays selectable.
- **O5 Tab names on phones:** a name wraps between words, never inside one; the count moves
  under the name only when the longest word and the count do not fit side by side (from 320 to
  about 380px). The count is at least 12px (the mockup: 11px).
- **O6 Cascade bugs fixed:** `.btn-secondary:active`, the Synergy Codes logo hover in `#talk`,
  the top padding of `.native-sec` below 45em, the centred lead of `.comm-head`.
- **O7 When the live diagram runs:** only for `HERO_DIAGRAM_MEDIA`. Elsewhere (and on Save-Data,
  without JavaScript or after a failed load) the stage shows the still image (`heroStill`)
  instead of the mockup's production screenshot; on phones the stage takes the still's
  proportions instead of 4:3. Without a still the hero would be copy and calls to action only.
  The stage is also limited by the window height.
- **O8 Forced colours and motion:** menu lines, mask markers, selected tab and segment,
  `.copy.done`, disabled states; `100vh` before `100dvh`; smooth scroll and transitions only
  without reduced motion.
- **O9 Semantics:** the facts strip is a list; code blocks are named regions; copy buttons have
  a hidden suffix; template panels are all visible without JavaScript; the video player is a
  native modal `<dialog>` (the mockup: a `div` with `role="dialog"`), and its controls are links
  to the videos that act as buttons.
- **O10 Links** (the review's rule): pages of ngdiagram.dev (docs, the template list, examples,
  roadmap, contact) open in the same tab without an arrow (`PageLink`); other sites and the
  template demos open in a new tab with the ↗ arrow (`ExtLink`) and a hidden "(opens in a new
  tab)"; logos and brand icons go without the arrow. The mockup's "Ask the ngDiagram team"
  button still has a new tab and an arrow; it follows the rule here. Repeated link texts get the
  card name as hidden context; footer links are at least 24px tall.
- **O11 Performance:** no render-blocking scripts and no external hosts: fonts, avatars, the
  `.voices` ground, the resource thumbnails and the team photo are self-hosted. The production
  build's analytics (see Analytics) are the one exception, loaded asynchronously. The team photo
  is a lazily loaded `<img>` in the photo cell (the mockup: the cell's background, which loads
  with the page); the hero still is preloaded where it shows.
- **O12** (retired with V7: the examples lead has no count and the Discord invite is the
  mockup's).
- **O13 Loading sketch:** where the live diagram runs, the stage shows a sketch of the same
  diagram while it loads, never a still: nodes and ports from the first paint, then the edges
  and the chart line draw themselves, and while the wait goes on a pulse runs along each edge.
  The live diagram fades in on top of it and the sketch goes (0.4s). With reduced motion the
  sketch stands still and goes at once. Not drawn in forced colours.
- **O14 Contact is part of this app:** every link to the contact page ("Talk to the team" in the
  bar and in `#talk`, "Ask the ngDiagram team", the FAQ, "Contact" in the footer) is `/contact`,
  not the production URL. On `/contact` the logo leads to `/`, the bar's "Talk to the team" to
  the form, and it and the footer's "Contact" carry `aria-current="page"`.
- **O15 V7 sections held to DESIGN.md** (impeccable polish, 2026-11-10): a resource card's kind,
  source and length stand under its description in sentence case (the mockup: an uppercase
  label above the title, which DESIGN.md rules out); FAQ answers are at most 72ch wide, and
  their inline code looks like the Angular-native cards' (the mockup left it unstyled); drawn
  icons replace the "+", "–" and "×" characters; the play button's growth animates only
  without reduced motion.
- **O16 Claims the repository backs** (2026-11-10, after a fact check): the FAQ
  answers rest on LICENSE, the package's peer dependencies, README and the docs. "Angular 18 or
  newer" replaces "Angular 18 and every newer release" (facts strip, "What is ngDiagram?", "Kept
  current"), and "Free to use under Apache 2.0, including in commercial projects" replaces
  "Everything in the library stays free under Apache 2.0, with no relicensing". The Business
  modeling text describes the BPMN Editor as its showcase does, and Engineering names
  production-line monitoring and the Assembly Line template (O2). The shorter lines make those
  blocks lower on narrow screens.
- **Missing assets (slots in `src/config/landing.ts`):** `stackblitzUrl` (O3) and the OG image
  (not a slot) are still open.
