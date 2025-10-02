import { Code } from '@astrojs/starlight/components';
import type { ComponentProps } from 'astro/types';
import {
  isRangeHighlight,
  isSingleLineHighlight,
  parseRangeHighlight,
  parseSingleLineHighlight,
  type Highlight,
  type RangeHighlight,
} from './highlights';

type CodeProps = ComponentProps<typeof Code>;

export function extractCodeHighlights(code: string, sectionId?: string) {
  const lines = getCodeLines(code, sectionId);
  const finalLines = [];
  const highlights: Highlight[] = [];

  let openRangeHighlight: RangeHighlight | null = null;

  let lineOffset = 0;
  for (const [index, line] of lines.entries()) {
    if (line.match(/@section/)) {
      lineOffset--;
      continue;
    }

    if (isSingleLineHighlight(line)) {
      const { highlight, substring, sectionId: id } = parseSingleLineHighlight(line);
      if (id && id !== sectionId) {
        lineOffset--;
        continue;
      }

      highlights.push({ type: highlight, line: index + lineOffset, substring });

      lineOffset--;
      continue;
    }

    if (isRangeHighlight(line)) {
      const { highlight, location, sectionId: id } = parseRangeHighlight(line);

      if (id && id !== sectionId) {
        lineOffset--;
        continue;
      }

      const indexWithOffset = index + lineOffset;

      if (openRangeHighlight && openRangeHighlight.type === highlight && location === 'end') {
        openRangeHighlight.end = indexWithOffset;
        highlights.push(openRangeHighlight);
        openRangeHighlight = null;
      } else if (!openRangeHighlight && location === 'start') {
        openRangeHighlight = { start: indexWithOffset + 1, end: indexWithOffset + 1, type: highlight };
      } else {
        throw new Error(`Invalid range highlight on line: ${line}`);
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
  const mark: CodeProps['mark'] = [];
  const collapse: CodeProps['collapse'] = [];

  for (const highlight of highlights) {
    if ('start' in highlight) {
      const range = `${highlight.start}-${highlight.end}`;

      switch (highlight.type) {
        case 'mark':
          mark.push({
            range,
          });
          break;
        case 'collapse':
          collapse.push(range);
          break;
      }

      continue;
    }

    if (highlight.type === 'mark-substring') {
      mark.push(highlight.substring);
    }
  }

  return { mark, collapse };
}

function getCodeLines(code: string, sectionId?: string) {
  const lines = code.split('\n');

  const hasSingleSection = lines.filter((line) => line.includes('@section-start')).length === 1;

  if (!sectionId && !hasSingleSection) {
    return lines;
  }

  const startSubstring = hasSingleSection ? `@section-start` : `@section-start:${sectionId}`;
  const endSubstring = hasSingleSection ? `@section-end` : `@section-end:${sectionId}`;

  const start = lines.findIndex((line) => line.includes(startSubstring));
  const end = lines.findIndex((line) => line.includes(endSubstring));

  if (start === -1 || end === -1 || start > end) {
    throw new Error(`Invalid section ID: ${sectionId}`);
  }

  return lines.slice(start + 1, end);
}
