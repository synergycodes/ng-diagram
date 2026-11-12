import type { ImageMetadata } from 'astro';
import heroStill from '../assets/hero-still.png';
import shareImage from '../assets/og-image.jpg';
import teamPhoto from '../assets/team-three-laptop.jpg';

/**
 * The served host. Every link to docs and templates is absolute against it; the contact page
 * belongs to this app and is linked by its path (O14).
 */
export const SITE = 'https://www.ngdiagram.dev';

export const site = (path: string): string => `${SITE}${path}`;

/**
 * Pages of ngdiagram.dev (docs, the template list, examples, roadmap, contact) open in the same
 * tab without an arrow (`PageLink`). Other sites and the template demos open in a new tab with the
 * ↗ arrow (`ExtLink`).
 */
export const LINKS = {
  docs: site('/docs'),
  quickStart: site('/docs/intro/quick-start/'),
  examples: site('/docs/examples/'),
  templates: site('/docs/templates/'),
  showcases: site('/docs/showcases/'),
  roadmap: site('/docs/intro/roadmap/'),
  changelog: site('/docs/changelog/'),
  ai: site('/docs/intro/ai/'),
  angularSupport: site('/docs/policies/api-stability/#angular-version-support'),
  contact: '/contact',
  liveDemo: 'https://synergycodes.github.io/ng-diagram-demo/',
  github: 'https://github.com/synergycodes/ng-diagram',
  npm: 'https://www.npmjs.com/package/ng-diagram',
  // The invite from the repository's README.
  discord: 'https://discord.com/invite/FDMjRuarFb',
  license: 'https://github.com/synergycodes/ng-diagram/blob/main/LICENSE',
  synergyCodes: 'https://www.synergycodes.com/',
  privacy: 'https://www.synergycodes.com/privacy-policy',
} as const;

/**
 * Slots for content that is not available yet. Each one switches its section from the
 * fallback state to the mockup state once it is set.
 */
export interface LandingSlots {
  /**
   * Still image of the hero diagram on a transparent background. It stands in where the live
   * diagram does not run; where it runs, the loading sketch shows until it is live (O7, O13).
   * Generated from the live diagram by `pnpm --filter landing still:capture`.
   */
  heroStill?: ImageMetadata;
  /** Team photo for the services section (left half of the split). */
  teamPhoto?: ImageMetadata;
  /** StackBlitz project of the Quick Start; without it the button is not rendered (O3). */
  stackblitzUrl?: string;
}

export const slots: LandingSlots = { heroStill, teamPhoto };

/**
 * The image of link previews on every page: Open Graph and the large Twitter card (1200 × 631).
 * The build serves it under `/_landing/` with a hashed name; `Layout` makes its URL absolute.
 */
export const SHARE_IMAGE = {
  image: shareImage,
  alt: 'ngDiagram – Diagramming for Angular. Native. Flexible. Designed for scale. Beside it, a workflow diagram built with ngDiagram.',
} as const;
