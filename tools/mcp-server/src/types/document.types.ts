/**
 * Document-related type definitions
 */

/**
 * Metadata for a single documentation file
 */
export interface DocumentMetadata {
  /** Relative path from docs root (e.g., "guides/palette.mdx") */
  path: string;
  /** Document title from frontmatter or filename */
  title: string;
  /** Document description from frontmatter (optional) */
  description?: string;
  /** Full text content of the document */
  content: string;
  /** Documentation URL path (e.g., "/docs/guides/palette") */
  url: string;
}
