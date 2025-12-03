import { MarkdownPageEvent } from 'typedoc-plugin-markdown';

/**
 * Custom TypeDoc plugin to extract @since tags from comments
 * and add them to the frontmatter as a 'version' field.
 */
export function load(app) {
  app.renderer.on(MarkdownPageEvent.BEGIN, (page) => {
    if (!page.model) return;

    const sinceTag = page.model.comment?.getTag('@since');

    if (sinceTag) {
      const versionText = sinceTag.content[0]?.text?.trim();
      const version = versionText?.replace(/^v/, '');

      // Add to frontmatter
      if (version) {
        page.frontmatter = {
          version: `since v${version}`,
          ...page.frontmatter,
        };
      }

      // Remove the @since tag from rendering in the body
      page.model.comment?.removeTags('@since');
    }
  });
}
