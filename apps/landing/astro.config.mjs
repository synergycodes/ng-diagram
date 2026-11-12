// @ts-check
import { fileURLToPath } from 'node:url';
import angular from '@analogjs/vite-plugin-angular';
import { defineConfig, envField, fontProviders } from 'astro/config';

/**
 * The hero diagram is a small Angular application compiled ahead of time by the Analog Vite
 * plugin. Only these sources go through the Angular compiler: the hero host in this app and
 * the docs example "Landing Page Diagram", whose node components the hero reuses.
 */
const ANGULAR_SOURCES = [
  /\/apps\/landing\/src\/hero\//,
  /\/apps\/docs\/src\/components\/angular\/examples\/landing-page-diagram\//,
];
const fontFile = (/** @type {string} */ name) => `@fontsource/${name}.woff2`;

const isAngularSource = (/** @type {string} */ id) => ANGULAR_SOURCES.some((pattern) => pattern.test(id));

export default defineConfig({
  site: 'https://www.ngdiagram.dev',
  output: 'static',
  env: {
    schema: {
      // `true` only in the production build: the pages then load the consent manager and Google
      // Tag Manager (config/analytics.ts). Every other build loads neither and sends nothing.
      LANDING_ANALYTICS: envField.boolean({ context: 'server', access: 'public', default: false }),
    },
  },
  // Self-hosted Roboto and Roboto Mono (latin), the faces the mockup loads from Google Fonts.
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Roboto',
      cssVariable: '--font-roboto',
      fallbacks: ['sans-serif'],
      options: {
        variants: [
          { weight: 400, style: 'normal', src: [fontFile('roboto/files/roboto-latin-400-normal')] },
          { weight: 500, style: 'normal', src: [fontFile('roboto/files/roboto-latin-500-normal')] },
          { weight: 700, style: 'normal', src: [fontFile('roboto/files/roboto-latin-700-normal')] },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Roboto Mono',
      cssVariable: '--font-roboto-mono',
      fallbacks: ['monospace'],
      options: {
        variants: [
          { weight: 400, style: 'normal', src: [fontFile('roboto-mono/files/roboto-mono-latin-400-normal')] },
          { weight: 500, style: 'normal', src: [fontFile('roboto-mono/files/roboto-mono-latin-500-normal')] },
        ],
      },
    },
  ],
  build: {
    // Unique prefix for the landing's assets, so a proxy can route them next to the docs.
    assets: '_landing',
  },
  vite: {
    // The Angular plugin turns Vite's own TypeScript transform off unless `oxc` is set. Keep it
    // for every other file (Astro scripts, data, config) and leave Angular sources to the plugin.
    oxc: { exclude: ANGULAR_SOURCES },
    // LANDING_SOURCEMAP=1 emits source maps for bundle analysis.
    build: { sourcemap: process.env.LANDING_SOURCEMAP === '1' },
    plugins: [
      {
        // The Angular plugin defines `ngServerMode` once for the whole Vite config, from
        // `build.ssr`. Astro builds the server and the browser environments from one config, so
        // the browser bundle would get `ngServerMode = true` and Angular refuses to bootstrap
        // (NG0401). Set it per environment instead.
        name: 'landing:angular-server-mode',
        configEnvironment(name) {
          return { define: { ngServerMode: String(name !== 'client') } };
        },
      },
      angular({
        tsconfig: fileURLToPath(new URL('./tsconfig.app.json', import.meta.url)),
        transformFilter: (_code, id) => isAngularSource(id),
        inlineStylesExtension: 'scss',
      }),
    ],
    resolve: {
      // The reused docs example resolves its imports through apps/docs/node_modules. pnpm links
      // the same package versions to the same store paths; dedupe guards the single copy.
      dedupe: [
        '@angular/common',
        '@angular/core',
        '@angular/platform-browser',
        'ng-diagram',
        'rxjs',
        'tslib',
        'uplot',
        'zone.js',
      ],
    },
  },
});
