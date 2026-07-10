/**
 * Showcase entries — projects built by the ngDiagram community.
 */

export type ShowcaseProject = {
  title: string;
  /** Short description of what the project is and how it uses ngDiagram. */
  description: string;
  /** Screenshot file name only, placed in `public/assets/showcases/`. E.g. `my-project.png`. */
  image: string;
  /** Alt text for the screenshot. Falls back to `title` when omitted. */
  imageAlt?: string;
  /** Live demo / site URL. Provide this or `codeHref` (or both). */
  href?: string;
  /** Public repository URL. Provide this or `href` (or both). */
  codeHref?: string;
  /** Author name (person or company). */
  author: string;
  /** Optional link to the author's profile or site (GitHub, portfolio, etc.). */
  authorUrl?: string;
};

export const showcaseProjects: ShowcaseProject[] = [
  {
    title: 'Footlball Pass Network Visualizaer',
    description:
      'Interactive pass network visualization tool for football match analysis. It renders player nodes positioned by their average pass origin on the pitch, with edges encoding pass volume (line width) and accuracy (color)',
    image: 'pass-network-visualizer.png',
    imageAlt: 'Screenshot of the Footlball Pass Network Visualizaer',
    href: 'https://mateuszdropinski.github.io/pass-network-visualizer/',
    codeHref: 'https://github.com/MateuszDropinski/pass-network-visualizer',
    author: 'Mateusz Dropiński',
    authorUrl: 'https://github.com/MateuszDropinski',
  },
  {
    title: 'Player Similarity Explorer',
    description:
      'Interactive graph tool for exploring statistical similarity between football players across Attacking, Passing, and Defensive dimensions',
    image: 'player-similarity-explorer.png',
    imageAlt: 'Screenshot of the Player Similarity Explorer',
    href: 'https://mateuszdropinski.github.io/player-similarity-explorer/',
    codeHref: 'https://github.com/MateuszDropinski/player-similarity-explorer',
    author: 'Mateusz Dropiński',
    authorUrl: 'https://github.com/MateuszDropinski',
  },
  {
    title: 'TTRPG Virtual Tabletop',
    description:
      'Tabletop RPG companion tool. It lets game masters run campaigns by dropping background maps and character or monster tokens onto a grid canvas, moving elements freely, measuring distances between positions, and pinning location markers that navigate between maps',
    image: 'ttrpg-virtual-tabletop.png',
    imageAlt: 'Screenshot of the TTRPG Virtual Tabletop',
    href: 'https://mateuszdropinski.github.io/rpg-game-master-tool/',
    codeHref: 'https://github.com/MateuszDropinski/rpg-game-master-tool',
    author: 'Mateusz Dropiński',
    authorUrl: 'https://github.com/MateuszDropinski',
  },
  {
    title: 'Binary Adder Visualization',
    description:
      'An interactive visualization of a 4-bit binary adder, where toggling input bits propagates signals through XOR, AND, and OR gates in real time to compute and display the result.',
    image: 'binary-adder-visualization.png',
    imageAlt: 'Screenshot of the Binary Adder Visualization',
    href: 'https://binary-adder-visualization.vercel.app/',
    codeHref: 'https://github.com/karoljaskolka/binary-adder-visualization',
    author: 'Karol Jaskółka',
    authorUrl: 'https://github.com/karoljaskolka',
  },
  {
    title: 'Warsaw Metro Timetable',
    description:
      'An interactive diagram of the Warsaw Metro network that displays departure timetables for each station.',
    image: 'warsaw-metro-timetable.png',
    imageAlt: 'Screenshot of the Warsaw Metro Timetable',
    href: 'https://warsaw-metro-timetable.vercel.app/',
    codeHref: 'https://github.com/karoljaskolka/warsaw-metro-timetable',
    author: 'Karol Jaskółka',
    authorUrl: 'https://github.com/karoljaskolka',
  },
  {
    title: 'Neural Network Visualization',
    description:
      'An interactive web application for building and visualizing neural network architectures. Configure layers, nodes and connections to define network topology - rendered in real time.',
    image: 'neural-network-visualization.png',
    imageAlt: 'Screenshot of the Neural Network Visualization',
    href: 'https://neural-network-diagram-visualization.vercel.app/',
    codeHref: 'https://github.com/karoljaskolka/neural-network-visualization',
    author: 'Karol Jaskółka',
    authorUrl: 'https://github.com/karoljaskolka',
  },
  {
    title: 'BPMN Editor',
    description:
      'Interactive BPMN process editor with events, activities, and gateways, typed connection styles, and swimlanes built as ngDiagram groups - featuring live lane resizing, per-lane ELK.js auto-layout, inline label editing, and a drag-and-drop shape palette.',
    image: 'bpmn-editor.png',
    imageAlt: 'Screenshot of the BPMN Editor showing a process diagram with swimlanes',
    href: 'https://synergycodes.github.io/bpmn-editor/',
    codeHref: 'https://github.com/synergycodes/bpmn-editor',
    author: 'Synergy Codes',
    authorUrl: 'https://www.synergycodes.com/',
  },
  {
    title: 'World Cup Chart',
    description:
      'An interactive FIFA World Cup 2026 chart that visualizes group standings and the knockout bracket, with collapsible group nodes and live match results, scorers, and assists.',
    image: 'world-cup-chart.png',
    imageAlt: 'Screenshot of the World Cup Chart showing group standings and the knockout bracket',
    href: 'https://www.wc26chart.com/',
    author: 'Synergy Codes',
    authorUrl: 'https://www.synergycodes.com/',
  },
];
