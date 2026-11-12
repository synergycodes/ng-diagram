import { expect, type Page, test } from '@playwright/test';
import { PAGES } from './support';

/** The served host: the ids of the shared entities are absolute against it. */
const SITE = 'https://www.ngdiagram.dev';

type GraphNode = Record<string, unknown>;

interface QuotationNode {
  text: string;
  about: unknown;
  author: { '@type': string; name: string; jobTitle: string; sameAs: string[] };
}

/** The page's JSON-LD: one script with one schema.org graph. */
async function readGraph(page: Page): Promise<GraphNode[]> {
  const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(scripts).toHaveLength(1);
  const data = JSON.parse(scripts[0] ?? '') as { '@context': string; '@graph': GraphNode[] };
  expect(data['@context']).toBe('https://schema.org');
  return data['@graph'];
}

/** Every `{ "@id": … }` reference in a value, at any depth. */
function references(value: unknown, found: string[] = []): string[] {
  if (Array.isArray(value)) {
    value.forEach((item) => references(item, found));
  } else if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 1 && entries[0]?.[0] === '@id') {
      found.push(String(entries[0][1]));
    } else {
      entries.forEach(([, item]) => references(item, found));
    }
  }
  return found;
}

for (const path of PAGES) {
  test(`${path}: the site's entities and the page node, every reference resolved`, async ({ page }) => {
    await page.goto(path);
    const graph = await readGraph(page);
    const ids = graph.map((node) => node['@id']).filter((id): id is string => typeof id === 'string');
    expect(new Set(ids).size, 'an id is used twice').toBe(ids.length);
    const byId = new Map(graph.map((node) => [node['@id'], node]));

    expect(byId.get(`${SITE}/#publisher`)).toMatchObject({
      '@type': 'Organization',
      name: 'Synergy Codes',
      sameAs: expect.arrayContaining(['https://www.wikidata.org/wiki/Q139550856']),
    });
    expect(byId.get(`${SITE}/#website`)).toMatchObject({
      '@type': 'WebSite',
      publisher: { '@id': `${SITE}/#publisher` },
    });
    expect(byId.get(`${SITE}/#software`)).toMatchObject({
      '@type': 'SoftwareApplication',
      name: 'ngDiagram',
      sameAs: expect.arrayContaining(['https://www.wikidata.org/wiki/Q139591568']),
    });
    expect(byId.get(`${SITE}/#source`)).toMatchObject({
      '@type': 'SoftwareSourceCode',
      isPartOf: { '@id': `${SITE}/#software` },
    });

    // The page node: the canonical URL and the title of this page, about ngDiagram.
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(byId.get(`${canonical}#webpage`)).toMatchObject({
      '@type': path === '/contact' ? 'ContactPage' : 'WebPage',
      url: canonical,
      name: await page.title(),
      isPartOf: { '@id': `${SITE}/#website` },
      mainEntity: { '@id': `${SITE}/#software` },
    });

    expect(references(graph).filter((id) => !byId.has(id))).toEqual([]);
  });
}

test('/: every quote is a Quotation by a Person with a LinkedIn profile, word for word as on the page', async ({
  page,
}) => {
  await page.goto('/');
  const shown = await page.locator('.quotes figure').evaluateAll((figures) =>
    figures.map((figure) => ({
      text: figure.querySelector('blockquote')?.textContent?.trim(),
      name: figure.querySelector('figcaption b')?.textContent?.trim(),
      jobTitle: figure.querySelector('figcaption small')?.textContent?.trim(),
    }))
  );
  const quotations = (await readGraph(page)).filter(
    (node) => node['@type'] === 'Quotation'
  ) as unknown as QuotationNode[];

  expect(shown.length).toBeGreaterThan(0);
  expect(
    quotations.map((quotation) => ({
      text: quotation.text,
      name: quotation.author.name,
      jobTitle: quotation.author.jobTitle,
    }))
  ).toEqual(shown);

  for (const quotation of quotations) {
    expect(quotation.about).toEqual({ '@id': `${SITE}/#software` });
    expect(quotation.author['@type']).toBe('Person');
    expect(quotation.author.sameAs).toHaveLength(1);
    expect(quotation.author.sameAs[0]).toMatch(/^https:\/\/www\.linkedin\.com\/in\/[a-z0-9-]+\/$/);
  }
  const profiles = quotations.map((quotation) => quotation.author.sameAs[0]);
  expect(new Set(profiles).size, 'two authors share a profile').toBe(profiles.length);
});

test('/: the FAQPage asks the questions of the FAQ section, in the same order', async ({ page }) => {
  await page.goto('/');
  const shown = (await page.locator('#faq summary').allTextContents()).map((text) => text.trim());
  const faqPage = (await readGraph(page)).find((node) => node['@type'] === 'FAQPage') as
    { mainEntity: { name: string }[] } | undefined;

  expect(shown.length).toBeGreaterThan(0);
  expect(faqPage?.mainEntity.map((question) => question.name)).toEqual(shown);
});

for (const path of PAGES) {
  test(`${path}: link previews show the share image, which the build serves`, async ({ page, request }) => {
    await page.goto(path);
    const meta = (key: string): Promise<string | null> =>
      page.locator(`meta[property="${key}"], meta[name="${key}"]`).getAttribute('content');

    const image = (await meta('og:image')) ?? '';
    expect(image).toMatch(/^https:\/\/www\.ngdiagram\.dev\/_landing\/og-image\.[\w-]+\.jpg$/);
    expect(await meta('og:image:width')).toBe('1200');
    expect(await meta('og:image:height')).toBe('631');
    expect(await meta('og:image:alt')).toMatch(/^ngDiagram – Diagramming for Angular\./);
    expect(await meta('twitter:card')).toBe('summary_large_image');
    expect(await meta('twitter:image:alt')).toBe(await meta('og:image:alt'));

    // The absolute URL points at the served host; the preview serves the same path.
    const response = await request.get(new URL(image).pathname);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('image/jpeg');
  });
}
