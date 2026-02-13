/**
 * Input schema for the get_doc tool
 */
export interface GetDocInput {
  /** Relative path from docs root (e.g., "guides/palette.mdx") */
  path: string;
}

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
