import type { ContentTile } from '../../../components/content-tile/content-tile.astro';

export const examples: ContentTile[] = [
  {
    title: 'Custom Node',
    description: 'Learn how to create a custom node with your own template and form controls.',
    href: '/docs/examples/custom-node',
    image: '/docs/assets/examples/custom-node.png',
    imageAlt: 'Screenshot of Custom Node example',
  },
  {
    title: 'Custom Edge',
    description:
      'Create custom edges with unique visual styles and interactive elements, including labeled edges and wave-shaped connections.',
    href: '/docs/examples/custom-edge',
    image: '/docs/assets/examples/custom-edge.png',
    imageAlt: 'Screenshot of Custom Edge example',
  },
  {
    title: 'Custom Model',
    description: 'Implement a custom model that persists data directly to localStorage with automatic synchronization.',
    href: '/docs/examples/custom-model',
    image: '/docs/assets/examples/custom-model.png',
    imageAlt: 'Screenshot of Custom Model example',
  },
  {
    title: 'Custom Ports',
    description: 'Customize port appearance and behavior with styling, positioning, and connection type configuration.',
    href: '/docs/examples/custom-ports',
    image: '/docs/assets/examples/custom-ports.png',
    imageAlt: 'Screenshot of Custom Ports example',
  },
  {
    title: 'Context Menu',
    description:
      'Implement a context menu that adapts its options based on whether a node or the diagram background is clicked.',
    href: '/docs/examples/context-menu',
    image: '/docs/assets/examples/context-menu.png',
    imageAlt: 'Screenshot of Context Menu example',
  },
  {
    title: 'Properties Sidebar',
    description:
      'Build an interactive properties panel that updates when nodes are selected and allows real-time editing of attributes.',
    href: '/docs/examples/properties-sidebar',
    image: '/docs/assets/examples/sidebar.png',
    imageAlt: 'Screenshot of Properties Sidebar example',
  },
  {
    title: 'Download Image',
    description:
      'Export the current flow as a PNG image using the html-to-image library with proper bounding box calculation.',
    href: '/docs/examples/download-image',
    image: '/docs/assets/examples/download-image.png',
    imageAlt: 'Screenshot of Download Image example',
  },
  {
    title: 'Save Persistence',
    description: 'Implement save and restore functionality to persist diagram state to local storage.',
    href: '/docs/examples/save-state',
    image: '/docs/assets/examples/save-persistence.png',
    imageAlt: 'Screenshot of Save Persistence example',
  },
  {
    title: 'Layout Integration',
    description:
      'Integrate external layout libraries like ELK.js for advanced automatic diagram layouts with edge routing.',
    href: '/docs/examples/layout-integration',
    image: '/docs/assets/examples/layout.png',
    imageAlt: 'Screenshot of Layout Integration example',
  },
  {
    title: 'Custom Middleware',
    description: 'Create a custom middleware that implements read-only functionality by intercepting state changes.',
    href: '/docs/examples/custom-middleware',
    image: '/docs/assets/examples/middlewares.png',
    imageAlt: 'Screenshot of Custom Middleware example',
  },
  {
    title: 'Angular Material Node',
    description: 'Learn how to integrate Angular Material components within your custom nodes.',
    href: '/docs/examples/angular-material-node',
    image: '/docs/assets/examples/angular-material.png',
    imageAlt: 'Screenshot of Angular Material Node example',
  },
  {
    title: 'Shortcut Manager',
    description:
      'Configure and update keyboard shortcuts with configureShortcuts() helper. Customize shortcuts at initialization or update them dynamically at runtime.',
    href: '/docs/examples/shortuct-manager',
    image: '/docs/assets/examples/shortcut-manager.png',
    imageAlt: 'Screenshot of Shortcut Manager example',
  },
  {
    title: 'Performance Test',
    description: 'Explore the performance capabilities with 500 nodes arranged in a grid with almost 500 connections.',
    href: '/docs/examples/performance-test',
    image: '/docs/assets/examples/performance-test.png',
    imageAlt: 'Screenshot of Performance Test example',
  },
];
