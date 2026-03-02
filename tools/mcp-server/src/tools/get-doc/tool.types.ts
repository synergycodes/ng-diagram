export type { GetDocInput } from './tool.validator.js';

/**
 * Output schema for the get_doc tool
 */
export interface GetDocOutput {
  /** Document title */
  title: string;
  /** Full markdown body with frontmatter stripped */
  body: string;
  /** Base page URL */
  url: string;
}
