import baseConfig from '../../../../../prettier.config.js';

/**
 * @type {import("prettier").Config}
 */
const config = {
  ...baseConfig,
  // Use a different prettier setup for the code presented in documentation examples
  printWidth: 80,
};

export default config;
