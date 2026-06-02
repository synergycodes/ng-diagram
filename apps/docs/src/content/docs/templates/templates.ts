type RegularTemplate = {
  type: 'regular';
  title: string;
  description: string;
  href: string;
  codeHref?: string;
  image: string;
  imageAlt?: string;
};

type ComingSoonTemplate = {
  type: 'coming-soon';
  title: string;
  description: string;
  badgeLabel?: string;
};

export type Template = RegularTemplate | ComingSoonTemplate;

export const templates: Template[] = [
  {
    type: 'regular',
    title: 'Org Chart',
    description:
      'Interactive organizational chart. A starter kit for tree-based diagrams with drag-and-drop reordering, expand/collapse subtrees, sidebar node editing, horizontal/vertical layouts, dark/light theme, minimap, and automatic tree layout powered by ELK.js.',
    href: 'https://synergycodes.github.io/ng-diagram-orgchart/',
    codeHref: 'https://github.com/synergycodes/ng-diagram-orgchart',
    image: '/docs/assets/templates/org-chart.png',
    imageAlt: 'Screenshot of the Org Chart starter kit showing a tree of person cards with expand/collapse controls',
  },
  {
    type: 'coming-soon',
    title: 'AV Template',
    description:
      'A starter kit for audiovisual system diagrams. Signal flow, equipment racks, and routing for integrators planning installations and documenting deployed setups.',
  },
  {
    type: 'coming-soon',
    title: 'Electrical Template',
    description:
      'A starter kit for electrical schematics and one-line diagrams. Components, wiring, and panel layouts for engineers documenting circuits and power distribution.',
  },
];
