import { Code } from '@astrojs/starlight/components';
import type { ComponentProps } from 'astro/types';

type CodeProps = ComponentProps<typeof Code>;

export function extractCodeHighlights(code: string) {
  const lines = code.split('\n');
  const finalLines = [];
  const highlights: Highlight[] = [];

  let openRangeHighlight: RangeHighlight | null = null;

  let lineOffset = 0;
  for (const [index, line] of lines.entries()) {
    const isSingleLineHighlight = singleLineHighlightRegex.test(line);
    if (isSingleLineHighlight) {
      const [_, highlight, substring] = line.match(singleLineHighlightRegex)!;
      highlights.push({ type: highlight, line: index + lineOffset, substring });

      lineOffset--;
      continue;
    }

    const isRangeHighlight = rangeHighlightRegex.test(line);
    if (isRangeHighlight) {
      const [_, highlight, location] = line.match(rangeHighlightRegex)!;

      const indexWithOffset = index + lineOffset;

      if (openRangeHighlight && openRangeHighlight.type === highlight && location === 'end') {
        openRangeHighlight.end = indexWithOffset;
        highlights.push(openRangeHighlight);
        openRangeHighlight = null;
      } else if (!openRangeHighlight && location === 'start') {
        openRangeHighlight = { start: indexWithOffset + 1, end: indexWithOffset + 1, type: highlight };
      } else {
        throw new Error('Invalid range highlight. Nested range highlights are not allowed.');
      }

      lineOffset--;
      continue;
    }

    finalLines.push(line);
  }

  const finalCode = finalLines.join('\n');

  const highlightProps = highlightsToCodeProps(highlights);

  return { finalCode, highlightProps };
}

function highlightsToCodeProps(highlights: Highlight[]) {
  function isRangeHighlight(highlight: Highlight): highlight is RangeHighlight {
    return highlight.type === keys.mark || highlight.type === keys.collapse;
  }

  const mark: CodeProps['mark'] = [];
  const collapse: CodeProps['collapse'] = [];

  for (const highlight of highlights) {
    if (isRangeHighlight(highlight)) {
      const range = `${highlight.start}-${highlight.end}`;

      if (highlight.type === 'mark') {
        mark.push({
          range,
        });
      } else if (highlight.type === 'collapse') {
        collapse.push(range);
      }

      continue;
    }

    if (highlight.type === 'mark-substring') {
      mark.push(highlight.substring);
    }
  }

  return { mark, collapse };
}

const keys = {
  mark: 'mark',
  collapse: 'collapse',
  'mark-substring': 'mark-substring',
};

type Highlight = RangeHighlight | SingleLineHighlight;

type SingleLineHighlight = {
  line: number;
  substring: string | RegExp;
  type: SingleLineHighlightType;
};

type SingleLineHighlightType = (typeof keys)['mark-substring'];

const rangeHighlightRegex = new RegExp(`//\\s*@(${keys.mark}|${keys.collapse})-(start|end)`);
const singleLineHighlightRegex = new RegExp('//\\s*@mark-substring\\s+(.+)');

type RangeHighlightType = typeof keys.mark | typeof keys.collapse;
type RangeHighlight = {
  start: number;
  end: number;
  type: RangeHighlightType;
};
