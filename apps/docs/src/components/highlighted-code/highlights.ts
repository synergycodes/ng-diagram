export function parseSingleLineHighlight(line: string) {
  const [_, highlight, substring] = line.match(singleLineHighlightRegex)!;

  return {
    highlight: highlight as SingleLineHighlightType,
    substring,
  };
}

export function isRangeHighlight(line: string) {
  return rangeHighlightRegex.test(line);
}

export function parseRangeHighlight(line: string) {
  const [_, highlight, location] = line.match(rangeHighlightRegex)!;

  return {
    highlight: highlight as RangeHighlightType,
    location,
  };
}

export function isSingleLineHighlight(line: string) {
  return singleLineHighlightRegex.test(line);
}

const highlightKeys = {
  mark: 'mark',
  collapse: 'collapse',
  'mark-substring': 'mark-substring',
} as const;

export type Highlight = RangeHighlight | SingleLineHighlight;

type SingleLineHighlight = {
  line: number;
  substring: string | RegExp;
  type: SingleLineHighlightType;
};

type SingleLineHighlightType = (typeof highlightKeys)['mark-substring'];

export const rangeHighlightRegex = new RegExp(`//\\s*@(${highlightKeys.mark}|${highlightKeys.collapse})-(start|end)`);
export const singleLineHighlightRegex = new RegExp(`//\\s*(${highlightKeys['mark-substring']})\\s+(.+)`);

type RangeHighlightType = typeof highlightKeys.mark | typeof highlightKeys.collapse;
export type RangeHighlight = {
  start: number;
  end: number;
  type: RangeHighlightType;
};
