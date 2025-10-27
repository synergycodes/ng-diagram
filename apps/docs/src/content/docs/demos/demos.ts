import type { ContentTile } from '../../../components/content-tile/content-tile.astro';

export const demos: ContentTile[] = [
  {
    title: 'Yjs Collaboration App',
    description:
      'A real-time collaborative diagram editor powered by Yjs. Multiple users can edit the same diagram simultaneously with conflict-free synchronization and live cursors.',
    // TODO: Provide proper link
    href: 'https://ngdiagram.dev/yjs-demo/',
    image: '/docs/assets/demos/yjs-collaboration-app.png',
    imageAlt: 'Screenshot of Yjs Collaboration App showing real-time collaborative diagram editing',
  },
];
