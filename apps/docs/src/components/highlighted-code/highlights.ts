export function parseSingleLineHighlight(line: string) {
  const { groups } = line.match(singleLineHighlightRegex) ?? {};

  if (!groups) {
    throw new Error('Invalid single line highlight');
  }

  const { highlight, substring, sectionId } = groups;

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
  const { groups } = line.match(rangeHighlightRegex) ?? {};

  if (!groups) {
    throw new Error('Invalid range highlight');
  }

  const { highlight, location, sectionId } = groups;

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

const commentStartPattern = '\\s*(//|<!--|/*)\\s*';
const sectionIdGroup = '(?<sectionId>[\\w-]*)';

const rangeHighlightGroup = `@(?<highlight>${highlightKeys.mark}|${highlightKeys.collapse})`;
const rangeLocationGroup = `(?<location>start|end)`;
const rangeHighlightRegex = new RegExp(
  `${commentStartPattern}${rangeHighlightGroup}-${rangeLocationGroup}\\:?${sectionIdGroup}`
);

const singleHighlightGroup = `@(?<highlight>${highlightKeys['mark-substring']})`;
const substringGroup = '(?<substring>[^:]+)';
const singleLineHighlightRegex = new RegExp(
  `${commentStartPattern}${singleHighlightGroup}:${substringGroup}\\:?${sectionIdGroup}`
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
