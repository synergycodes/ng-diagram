import { LINKS, site } from '../config/landing';
import { faq, faqAnswerText, quotes } from './sections';

/** One node of the page's JSON-LD graph (schema.org). */
export type GraphNode = Record<string, unknown>;

/**
 * The ids of the entities that every page shares. Keep them stable: search engines tie what they
 * know about an entity to its id.
 */
export const IDS = {
  publisher: site('/#publisher'),
  website: site('/#website'),
  software: site('/#software'),
  source: site('/#source'),
} as const;

const LICENSE = 'https://www.apache.org/licenses/LICENSE-2.0';

const ref = (id: string) => ({ '@id': id });

/**
 * Synergy Codes, the website, ngDiagram and its source code, the same on every page. `sameAs` lists
 * the pages that identify the same entity elsewhere (Wikidata, LinkedIn, GitHub, npm).
 */
export const siteEntities: GraphNode[] = [
  {
    '@type': 'Organization',
    '@id': IDS.publisher,
    name: 'Synergy Codes',
    url: LINKS.synergyCodes,
    sameAs: [
      'https://www.wikidata.org/wiki/Q139550856',
      'https://www.linkedin.com/company/synergy-codes/',
      'https://github.com/synergycodes/',
    ],
  },
  {
    '@type': 'WebSite',
    '@id': IDS.website,
    name: 'ngDiagram',
    url: site('/'),
    inLanguage: 'en',
    publisher: ref(IDS.publisher),
  },
  {
    '@type': 'SoftwareApplication',
    '@id': IDS.software,
    name: 'ngDiagram',
    description:
      'ngDiagram is an open-source Angular diagram library for interactive diagrams, node-based editors, and workflow editors.',
    url: site('/'),
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any',
    isAccessibleForFree: true,
    license: LICENSE,
    sameAs: ['https://www.wikidata.org/wiki/Q139591568', LINKS.github, LINKS.npm],
    creator: ref(IDS.publisher),
    publisher: ref(IDS.publisher),
  },
  {
    '@type': 'SoftwareSourceCode',
    '@id': IDS.source,
    name: 'synergycodes/ng-diagram',
    codeRepository: LINKS.github,
    programmingLanguage: 'TypeScript',
    runtimePlatform: 'Angular',
    license: LICENSE,
    isPartOf: ref(IDS.software),
    author: ref(IDS.publisher),
    maintainer: ref(IDS.publisher),
  },
];

export interface PageNode {
  /** schema.org type of the page. */
  type: 'WebPage' | 'ContactPage';
  /** The canonical URL. */
  url: string;
  name: string;
  description: string;
}

/** The page itself: part of the website and about ngDiagram. */
export const webPage = (page: PageNode): GraphNode => ({
  '@type': page.type,
  '@id': `${page.url}#webpage`,
  url: page.url,
  name: page.name,
  description: page.description,
  inLanguage: 'en',
  isPartOf: ref(IDS.website),
  about: ref(IDS.software),
  mainEntity: ref(IDS.software),
});

/** The FAQ as FAQPage structured data, word for word as on the page. */
export const faqPage: GraphNode = {
  '@type': 'FAQPage',
  mainEntity: faq.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: { '@type': 'Answer', text: faqAnswerText(item.answer) },
  })),
};

/**
 * The quotes of the voices section, word for word as on the page. Each author is a Person linked to
 * their LinkedIn profile. The type is Quotation, not Review: a review needs a rating, and these
 * quotes have none.
 */
export const quotations: GraphNode[] = quotes.map((quote) => ({
  '@type': 'Quotation',
  text: quote.text,
  about: ref(IDS.software),
  author: {
    '@type': 'Person',
    name: quote.name,
    jobTitle: quote.role,
    sameAs: [quote.linkedin],
  },
}));
