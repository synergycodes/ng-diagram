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
    href: 'https://www.ngdiagram.dev/templates/org-chart/',
    codeHref: 'https://github.com/synergycodes/ng-diagram-orgchart',
    image: '/docs/assets/templates/org-chart.png',
    imageAlt: 'Screenshot of the Org Chart starter kit showing a tree of person cards with expand/collapse controls',
  },
  {
    type: 'regular',
    title: 'Electric Circuit',
    description:
      'Interactive circuit / schematic editor. A starter kit for building your own schematic capture or node-based editor. Drag real components from a searchable SVG library, wire them port-to-port with smart junctions, and export to SVG, JPEG, or JSON.',
    href: 'https://www.ngdiagram.dev/templates/electric-circuit/',
    codeHref: 'https://github.com/synergycodes/ng-diagram-electric-circuit',
    image: '/docs/assets/templates/electric-circuit.png',
    imageAlt:
      'Screenshot of the circuit editor: electronic components wired into a schematic with a parts palette and a properties panel for editing component specs.',
  },
  {
    type: 'regular',
    title: 'Single-Line Diagram',
    description:
      'Interactive SLD editor for high-voltage electrical substations. A starter kit for building your own domain-specific schematic editor. Place IEC 60617 symbols for switchgear, transformers, and instrument transformers, connect them with geometry-derived junctions, and edit every component through a schema-driven properties panel.',
    href: 'https://www.ngdiagram.dev/templates/single-line-diagram/',
    codeHref: 'https://github.com/synergycodes/ng-diagram-single-line-diagram',
    image: '/docs/assets/templates/single-line-diagram.png',
    imageAlt:
      'Screenshot of the single-line diagram editor: IEC 60617 substation symbols placed from a categorized palette onto a schematic canvas.',
  },
  {
    type: 'coming-soon',
    title: 'AV Template',
    description:
      'A starter kit for audiovisual system diagrams. Signal flow, equipment racks, and routing for integrators planning installations and documenting deployed setups.',
  },
];
