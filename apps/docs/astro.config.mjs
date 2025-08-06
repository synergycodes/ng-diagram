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
      markdown: {},
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/synergycodes/angularflow' }],
      sidebar: [
        {
          label: 'Guides',
          items: [{ label: 'Example Guide', slug: 'guides/example' }],
        },
        {
          label: 'Reference',
          autogenerate: { directory: 'reference' },
        },
      ],
    }),
  ],
});
