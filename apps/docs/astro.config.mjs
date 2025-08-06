// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

import angular from '@analogjs/astro-angular';

export default defineConfig({
  integrations: [
    angular({
      vite: {
        transformFilter: (_code, id) => {
          return id.includes('src/components/angular');
        },
        inlineStylesExtension: 'scss|sass|less',
        include: ['@angular/compiler'],
        jit: true,
      },
    }),
    starlight({
      title: 'NgDiagram',
      customCss: ['./src/styles/custom.css'],
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/synergycodes/angularflow' }],
      sidebar: [
        {
          label: 'Intro',
          autogenerate: { directory: 'intro' },
        },
        {
          label: 'Internals',
          autogenerate: { directory: 'internals' },
        },
        {
          label: 'Examples',
          autogenerate: { directory: 'examples' },
        },
      ],
    }),
  ],
});
