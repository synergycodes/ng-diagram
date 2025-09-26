export function parseSingleLineHighlight(line: string) {
  const [_, __, highlight, substring, sectionId] = line.match(singleLineHighlightRegex)!;

  return {
    highlight: highlight as SingleLineHighlightType,
    substring,
    sectionId,
  };
}

export function isRangeHighlight(line: string) {
  return rangeHighlightRegex.test(line);
}

export function parseRangeHighlight(line: string) {
  const [_, __, highlight, location, sectionId] = line.match(rangeHighlightRegex)!;
  console.log(line.match(rangeHighlightRegex));

  return {
    highlight: highlight as RangeHighlightType,
    location,
    sectionId,
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

const commentStartPattern = '(//|<!--)';
const rangeHighlightRegex = new RegExp(
  `\\s*${commentStartPattern}\\s*@(${highlightKeys.mark}|${highlightKeys.collapse})-(start|end)\\s+(.+)`
);
const singleLineHighlightRegex = new RegExp(
  `${commentStartPattern}\\s*(${highlightKeys['mark-substring']})\\s+(.+)\\s+(.+)`
);

export type Highlight = RangeHighlight | SingleLineHighlight;

export type RangeHighlight = {
  start: number;
  end: number;
  type: RangeHighlightType;
};

type RangeHighlightType = typeof highlightKeys.mark | typeof highlightKeys.collapse;

type SingleLineHighlight = {
  line: number;
  substring: string | RegExp;
  type: SingleLineHighlightType;
};

type SingleLineHighlightType = (typeof highlightKeys)['mark-substring'];
