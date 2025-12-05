import { MarkdownPageEvent } from 'typedoc-plugin-markdown';

/**
 * Custom TypeDoc plugin to extract @since tags from comments
 * and add them to the frontmatter as a 'version' field.
 */
export function load(app) {
  app.renderer.on(MarkdownPageEvent.BEGIN, (page) => {
    if (!page.model) return;

    let sinceTag = page.model.comment?.getTag('@since');

    // If not found, check signatures (for functions/methods)
    if (!sinceTag && Array.isArray(page.model.signatures)) {
      for (const sig of page.model.signatures) {
        sinceTag = sig.comment?.getTag('@since');
        if (sinceTag) break;
      }
    }

    if (sinceTag) {
      const versionText = sinceTag.content[0]?.text?.trim();
      const version = versionText?.replace(/^v/, '');

      if (version) {
        page.frontmatter = {
          version: `since v${version}`,
          ...page.frontmatter,
        };
      }

      // Remove the @since tag from rendering in the body - normally in functions/methods since tags appear there
      if (page.model.comment) page.model.comment.removeTags('@since');
      if (Array.isArray(page.model.signatures)) {
        for (const sig of page.model.signatures) {
          sig.comment?.removeTags('@since');
        }
      }
    }
  });
}
