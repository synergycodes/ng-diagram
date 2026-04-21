import type { ContentTile } from '../../../components/content-tile/content-tile.astro';

export const templates: ContentTile[] = [
  {
    title: 'Org Chart',
    description:
      'Interactive organizational chart. A starter kit for tree-based diagrams with drag-and-drop reordering, expand/collapse subtrees, sidebar node editing, horizontal/vertical layouts, dark/light theme, minimap, and automatic tree layout powered by ELK.js.',
    href: 'https://synergycodes.github.io/ng-diagram-orgchart/',
    codeHref: 'https://github.com/synergycodes/ng-diagram-orgchart',
    image: '/docs/assets/templates/org-chart.png',
    imageAlt: 'Screenshot of the Org Chart starter kit showing a tree of person cards with expand/collapse controls',
  },
];
