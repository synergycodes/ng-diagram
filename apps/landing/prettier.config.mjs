import * as astroPlugin from 'prettier-plugin-astro';
import rootConfig from '../../prettier.config.mjs';

/**
 * The root config plus the Astro plugin. Kept in this app so the root `format:check` formats
 * this app's `.astro` files without starting to check the docs' ones. The plugin is passed as
 * a module, because the root run resolves plugin names from the repository root.
 *
 * @type {import("prettier").Config}
 */
const config = {
  ...rootConfig,
  plugins: [astroPlugin],
  overrides: [{ files: '*.astro', options: { parser: 'astro' } }],
};

export default config;
