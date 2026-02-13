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

/**
 * Full page-level data for a documentation file
 */
export interface DocumentPage {
  /** Document title from frontmatter or filename */
  title: string;
  /** Full markdown body with frontmatter stripped */
  body: string;
  /** Base page URL (no anchor) */
  url: string;
}

/**
 * A single section within a documentation page, split on ## headings
 */
export interface DocumentSection {
  /** Title of the parent page (from frontmatter or filename) */
  pageTitle: string;
  /** Title of this section (## heading text, or pageTitle for pages without ## headings) */
  sectionTitle: string;
  /** Full markdown content of this section (no frontmatter) */
  content: string;
  /** Relative path from docs root (e.g., "guides/palette.mdx") */
  path: string;
  /** Full documentation URL with anchor (e.g., "https://example.com/docs/guides/palette#colors") */
  url: string;
  /** Document description from frontmatter (only on the first section of a page) */
  description?: string;
}
