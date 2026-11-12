# Deviations from the design mockup

The landing follows the approved design mockup of the page, which is not part of this
repository. These are its intentional differences. Code comments and the `RULES` of
`tests/parity.spec.ts` refer to them by their IDs.

- **O1 Navigation up to 64em.**
  - A menu button and panel replace the three-line bar; "Talk to the team" stays in the bar at
    every width.
  - Above 64em the gaps are fluid, and the bar wraps as a safety net.
  - `scroll-padding-top` follows the header height (`--nav-h`).
  - When the text grows (text spacing, a larger default font), the CTA label wraps instead of
    pushing the bar off screen.
- **O2 Templates.**
  - The five real templates, without placeholders, sit in two domains: Engineering (Electric
    Circuit, Single-Line Diagram, AV Schematic, Assembly Line) and Business modeling (Org
    Chart).
  - The mockup's Workflow tab is left out, and its Assembly Line card is listed under
    Engineering.
  - A domain with four or more templates pages them in a row (`RowScroller`); a smaller one is a
    card grid.
- **O3 StackBlitz.** The Quick Start's StackBlitz button renders only when `slots.stackblitzUrl`
  (`src/config/landing.ts`) is set. It is not set.
- **O4 Hero accessibility.**
  - The diagram is no Tab stop, has no shortcuts and does not zoom, and its host is
    `aria-hidden`.
  - Ctrl + wheel stays with the browser.
  - The watermark is off by config.
  - The hero text stays selectable.
- **O5 Tab names on phones.**
  - A name wraps between words, never inside one.
  - The count moves under the name only when the longest word and the count do not fit side by
    side (from 320 to about 380px).
  - The count is at least 12px (the mockup: 11px).
- **O6 Cascade bugs fixed.**
  - `.btn-secondary:active`, the Synergy Codes logo hover in `#talk`, the top padding of
    `.native-sec` below 45em, and the centred lead of `.comm-head`.
  - The closing call ("You're never stuck alone") has the blocks' padding between the project
    facts band's rule and its title, and below its button: 100px, and 64px below 45em. The mockup
    has 44px above the title (none below 45em) and 100px below the button.
- **O7 Where the live diagram runs.**
  - The live diagram runs only where `HERO_DIAGRAM_MEDIA` matches.
  - Elsewhere, and on Save-Data, without JavaScript or after a failed load, the stage shows a
    still image of the diagram (`heroStill`) instead of the mockup's screenshot.
  - On phones the stage takes the still's proportions instead of 4:3.
  - The stage is also limited by the window height.
- **O8 Forced colours and motion.**
  - The menu lines, mask markers, the selected tab and segment, `.copy.done` and the disabled
    states stay visible in forced colours.
  - `100vh` comes before `100dvh`.
  - Smooth scrolling and transitions run only without reduced motion.
- **O9 Semantics.**
  - The facts strip is a list.
  - Code blocks are named regions, and copy buttons have a hidden suffix.
  - All template panels are visible without JavaScript.
  - The video player is a native modal `<dialog>` (the mockup: a `div` with `role="dialog"`).
    Its controls are links to the videos that act as buttons.
- **O10 Links.**
  - Pages of ngdiagram.dev (docs, the template list, examples, roadmap, contact) open in the
    same tab without an arrow (`PageLink`).
  - Other sites and the template demos open in a new tab with the ↗ arrow (`ExtLink`) and a
    hidden "(opens in a new tab)". Logos and brand icons go without the arrow.
  - The mockup's "Ask the ngDiagram team" button opens a new tab; here it follows the same rule.
  - Repeated link texts get the card name as hidden context.
  - Footer links are at least 24px tall.
- **O11 Performance.**
  - No render-blocking scripts and no external hosts: the fonts, avatars, the `.voices` ground,
    the resource thumbnails and the team photo are self-hosted. The analytics of production
    builds are the one exception, and they load asynchronously.
  - The team photo is a lazily loaded `<img>` (the mockup: the cell's background).
  - The hero still is preloaded where it shows.
- **O12** is not used.
- **O13 Loading sketch.**
  - Where the live diagram runs, the stage shows a sketch of the same diagram while it loads,
    never a still. Nodes and ports show from the first paint; then the edges and the chart line
    draw themselves, and while the wait goes on, a pulse runs along each edge.
  - The live diagram fades in on top of the sketch, and the sketch goes (0.4s).
  - With reduced motion the sketch stands still and goes at once. It is not drawn in forced
    colours.
- **O14 The contact page is part of this app.**
  - Every link to it ("Talk to the team" in the bar and in `#talk`, "Ask the ngDiagram team",
    the FAQ, "Contact" in the footer) is the relative `/contact`.
  - On `/contact` the logo leads to `/`, and the bar's "Talk to the team" leads to the form. That
    link and the footer's "Contact" carry `aria-current="page"`.
- **O15 Design system rules.**
  - A resource card's kind, source and length stand under its description in sentence case (the
    mockup: an uppercase label above the title).
  - FAQ answers are at most 72ch wide, and their inline code looks like the Angular-native
    cards'.
  - Drawn icons replace the "+", "–" and "×" characters.
  - The play button's growth animates only without reduced motion.
- **O16 Claims.**
  - The FAQ answers rest on the repository: LICENSE, the package's peer dependencies, the README
    and the docs.
  - "Angular 18 or newer" replaces "Angular 18 and every newer release" (the facts strip, "What
    is ngDiagram?", "Kept current").
  - "Free to use under Apache 2.0, including in commercial projects" replaces "Everything in the
    library stays free under Apache 2.0, with no relicensing".
  - The Business modeling text describes the BPMN Editor as its showcase does, and Engineering
    names production-line monitoring and the Assembly Line template (O2).
- **O17 Paging rows below 45em.**
  - A row's paging buttons and the skip link to them stay below 45em wherever there is a mouse,
    trackpad or pen, or no pointer at all, so a narrow window or a zoomed-in page can still page
    the row.
  - On touch-only devices they go, as in the mockup, and a swipe pages the row.
  - Where one card fits, the position reads "Templates 2 of 4" (the mockup: "Templates 2–2 of 4").
- **Link previews**, which the mockup does not have:
  - both pages share one image for Open Graph and a large Twitter card: `SHARE_IMAGE` in
    `src/config/landing.ts` (`src/assets/og-image.jpg`, 1200 × 631, with its alt text).
