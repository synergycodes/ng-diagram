import type { ImageMetadata } from 'astro';
import customEdge from '../../../docs/public/assets/examples/custom-edge.png';
import customNode from '../../../docs/public/assets/examples/custom-node.png';
import customPorts from '../../../docs/public/assets/examples/custom-ports.png';
import expandCollapseGroups from '../../../docs/public/assets/examples/expand-collapse-groups.png';
import expandCollapse from '../../../docs/public/assets/examples/expand-collapse.png';
import layout from '../../../docs/public/assets/examples/layout.png';
import { site } from '../config/landing';

/** No count, so the copy does not change when examples are added to the docs. */
export const examplesLead =
  'Runnable Angular diagram examples in the docs – pick the feature you need and start from working code.';

export interface ExampleCard {
  title: string;
  description: string;
  image: ImageMetadata;
  href: string;
}

/** Six of the docs examples (`apps/docs/src/content/docs/examples/`). */
export const examples: ExampleCard[] = [
  {
    title: 'Custom node',
    description: 'Your own template and form controls inside a node.',
    image: customNode,
    href: site('/docs/examples/custom-node'),
  },
  {
    title: 'Custom edge',
    description: 'Edges with their own styles and interactive elements, including labels and wave shapes.',
    image: customEdge,
    href: site('/docs/examples/custom-edge'),
  },
  {
    title: 'Expand/collapse groups',
    description: 'Collapse a group to a header bar; boundary edges reroute so external connections stay visible.',
    image: expandCollapseGroups,
    href: site('/docs/examples/expand-collapse-groups'),
  },
  {
    title: 'Custom ports',
    description: 'Port appearance, position, and connection types under your control.',
    image: customPorts,
    href: site('/docs/examples/custom-ports'),
  },
  {
    title: 'Layout integration',
    description: 'ELK.js automatic layout with edge routing.',
    image: layout,
    href: site('/docs/examples/layout-integration'),
  },
  {
    title: 'Expand/collapse subtree',
    description: 'Collapse and expand subtrees, with ELK.js updating the layout of the visible nodes.',
    image: expandCollapse,
    href: site('/docs/examples/expand-collapse'),
  },
];
