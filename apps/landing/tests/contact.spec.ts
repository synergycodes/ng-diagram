import { expect, test, type Page, type Request, type Route } from '@playwright/test';
import { HUBSPOT_FIELDS } from '../src/config/contact';
import { FIELD_MESSAGES } from '../src/data/contact';
import { axeViolations, measureOverflow, openLanding, PAGES } from './support';

/**
 * The contact page. No test ever reaches HubSpot: every request to its API is intercepted and,
 * unless a test answers it, aborted. While the build has no HubSpot IDs, the tests put a dummy
 * endpoint into `data-endpoint`, which the form reads at the moment of sending.
 */

const HUBSPOT = 'https://api.hsforms.com/**';
const TEST_ENDPOINT =
  'https://api.hsforms.com/submissions/v3/integration/submit/0/00000000-0000-0000-0000-000000000000';
const TITLE = 'Contact the ngDiagram team – consulting and support';

type Handler = (route: Route) => Promise<void> | void;

/** Opens /contact. Returns the HubSpot requests the page makes; `handler` answers them. */
async function openContact(page: Page, handler?: Handler): Promise<Request[]> {
  const requests: Request[] = [];
  await page.route(HUBSPOT, async (route) => {
    requests.push(route.request());
    await (handler ? handler(route) : route.abort());
  });
  await openLanding(page, '/contact');
  await page.evaluate((endpoint) => {
    const form = document.querySelector<HTMLElement>('[data-contact-form]')!;
    form.dataset['endpoint'] ||= endpoint;
  }, TEST_ENDPOINT);
  return requests;
}

const json =
  (status: number, body: unknown): Handler =>
  (route) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

async function fillValid(page: Page, name = 'Anna Maria Nowak'): Promise<void> {
  await page.fill('#cf-name', name);
  await page.fill('#cf-company', 'Acme Engineering');
  await page.fill('#cf-email', 'anna@acme-engineering.com');
  await page.fill('#cf-message', 'A single-line diagram editor for substations.');
}

const send = (page: Page) => page.click('[data-contact-submit]');
const errorOf = (page: Page, id: string) => page.locator(`#${id}-error`);
const alertBox = (page: Page) => page.locator('[data-contact-alert]');
const doneTitle = (page: Page) => page.locator('[data-done-title]');

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
});

test.describe('validation', () => {
  test('an empty form shows four errors and focuses the first field', async ({ page }) => {
    const requests = await openContact(page);
    await send(page);
    await expect(page.locator('.field-error:not([hidden])')).toHaveCount(4);
    for (const id of ['cf-name', 'cf-company', 'cf-email', 'cf-message']) {
      await expect(page.locator(`#${id}`)).toHaveAttribute('aria-invalid', 'true');
      await expect(page.locator(`#${id}`)).toHaveAttribute('aria-describedby', new RegExp(`${id}-error`));
    }
    await expect(errorOf(page, 'cf-name')).toHaveText(FIELD_MESSAGES.name.missing);
    await expect(errorOf(page, 'cf-email')).toHaveText(FIELD_MESSAGES.email.missing);
    await expect(page.locator('#cf-name')).toBeFocused();
    expect(requests).toHaveLength(0);
  });

  test('a field with an error checks again on every input', async ({ page }) => {
    await openContact(page);
    await send(page);
    await page.locator('#cf-name').pressSequentially('A');
    await expect(errorOf(page, 'cf-name')).toBeHidden();
    await expect(page.locator('#cf-name')).not.toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#cf-name')).not.toHaveAttribute('aria-describedby', /error/);
  });

  test('blur checks only fields the visitor changed', async ({ page }) => {
    await openContact(page);
    await page.locator('#cf-name').focus();
    await page.keyboard.press('Tab');
    await expect(errorOf(page, 'cf-name')).toBeHidden();
    await page.locator('#cf-company').pressSequentially('x');
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Tab');
    await expect(errorOf(page, 'cf-company')).toHaveText(FIELD_MESSAGES.company.missing);
  });

  test('free email providers are refused, company domains pass', async ({ page }) => {
    await openContact(page);
    for (const email of ['a@gmail.com', 'b@wp.pl', 'c@yahoo.co.uk', 'd@Hotmail.de']) {
      await page.fill('#cf-email', email);
      await page.locator('#cf-email').blur();
      await expect(errorOf(page, 'cf-email'), email).toHaveText(FIELD_MESSAGES.email.freeDomain);
    }
    await page.fill('#cf-email', 'c@synergycodes.com');
    await expect(errorOf(page, 'cf-email')).toBeHidden();
  });

  test('an address without a domain gets the format message', async ({ page }) => {
    await openContact(page);
    await page.fill('#cf-email', 'name@company');
    await page.locator('#cf-email').blur();
    await expect(errorOf(page, 'cf-email')).toHaveText(FIELD_MESSAGES.email.format);
  });

  test('length limits and the message counter', async ({ page }) => {
    await openContact(page);
    for (const id of ['cf-name', 'cf-company', 'cf-email']) {
      await expect(page.locator(`#${id}`)).toHaveAttribute('maxlength', '256');
    }
    await expect(page.locator('#cf-message')).toHaveAttribute('maxlength', '5000');
    await page.locator('#cf-name').focus();
    await page.keyboard.insertText('x'.repeat(300));
    expect(await page.locator('#cf-name').inputValue()).toHaveLength(256);

    const counter = page.locator('#cf-message-count');
    await page.fill('#cf-message', 'x'.repeat(3999));
    await expect(counter).toBeHidden();
    await page.fill('#cf-message', 'x'.repeat(4100));
    await expect(counter).toHaveText('900 characters left');
    await expect(page.locator('#cf-message')).toHaveAttribute('aria-describedby', /cf-message-count/);
  });

  test('the rail marks a step done while its fields are valid', async ({ page }) => {
    await openContact(page);
    const done = () => page.$$eval('[data-step]', (steps) => steps.map((step) => step.hasAttribute('data-done')));
    expect(await done()).toEqual([false, false, false]);
    await page.fill('#cf-name', 'Anna Nowak');
    await page.fill('#cf-company', 'Acme');
    await page.fill('#cf-email', 'anna@acme.com');
    expect(await done()).toEqual([true, false, false]);
    // Decoration only: no error appears for the untouched message field.
    await expect(page.locator('.field-error:not([hidden])')).toHaveCount(0);
    await page.fill('#cf-email', 'anna@gmail.com');
    expect(await done()).toEqual([false, false, false]);
  });
});

test.describe('sending', () => {
  test('success: one POST with the fields of the HubSpot form, then the confirmation', async ({ page, baseURL }) => {
    const requests = await openContact(page, json(200, { inlineMessage: '<b>not shown</b>' }));
    await fillValid(page, '  Anna Maria Nowak ');
    await page.check('#cf-marketing');
    await send(page);

    await expect(doneTitle(page)).toBeFocused();
    expect(requests).toHaveLength(1);
    const request = requests[0]!;
    expect(request.method()).toBe('POST');
    expect(request.url()).toBe(
      (await page.evaluate(() => document.querySelector<HTMLElement>('[data-contact-form]')!.dataset['endpoint']))!
    );
    const body = request.postDataJSON();
    const field = (name: string, value: string) => ({ objectTypeId: '0-1', name, value });
    expect(body.fields).toEqual([
      field(HUBSPOT_FIELDS.fullName, 'Anna Maria Nowak'),
      field(HUBSPOT_FIELDS.company, 'Acme Engineering'),
      field(HUBSPOT_FIELDS.email, 'anna@acme-engineering.com'),
      field(HUBSPOT_FIELDS.message, 'A single-line diagram editor for substations.'),
      field(HUBSPOT_FIELDS.marketing, 'true'),
    ]);
    expect(body.context).toEqual({ pageUri: `${baseURL}/contact`, pageName: TITLE });
    // The HubSpot form has no consent options; sending them could be refused.
    expect(body.legalConsentOptions).toBeUndefined();

    await expect(doneTitle(page)).toHaveText('Thanks – we’ll be in touch within 24 hours');
    const sent = page.locator('[data-contact-sent]');
    await expect(sent).toContainText(
      'An engineer from the ngDiagram team will read your message and reply to anna@acme-engineering.com.'
    );
    await expect(sent).not.toContainText('not shown');
    await expect(sent.locator('.sent-cards h2')).toHaveText(['Documentation', 'Examples', 'Community']);
    // The confirmation replaces the intro, the form and the community block, from the top.
    for (const selector of ['#contact-title', '#cf-name', '#contact-community', '.contact-about']) {
      await expect(page.locator(selector), selector).toBeHidden();
    }
    await expect(page.locator('[data-contact-form]')).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('[data-contact]')).toHaveAttribute('data-state', 'sent');
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test('an unchecked marketing box is sent as false', async ({ page }) => {
    const requests = await openContact(page, json(200, {}));
    await fillValid(page);
    await send(page);
    await expect(doneTitle(page)).toBeVisible();
    const fields: { name: string; value: string }[] = requests[0]!.postDataJSON().fields;
    expect(fields.find((item) => item.name === HUBSPOT_FIELDS.marketing)?.value).toBe('false');
  });

  test('a filled honeypot ends in success without a request', async ({ page }) => {
    const requests = await openContact(page);
    await fillValid(page);
    await page.evaluate(() => {
      document.querySelector<HTMLInputElement>('[data-honeypot]')!.value = 'https://spam.example';
    });
    await send(page);
    await expect(doneTitle(page)).toBeVisible();
    expect(requests).toHaveLength(0);
  });

  test('400 BLOCKED_EMAIL: the error goes to the email field and the data stays', async ({ page }) => {
    await openContact(page, json(400, { errors: [{ message: 'Blocked', errorType: 'BLOCKED_EMAIL' }] }));
    await fillValid(page);
    await send(page);
    await expect(errorOf(page, 'cf-email')).toHaveText(FIELD_MESSAGES.email.freeDomain);
    await expect(page.locator('#cf-email')).toBeFocused();
    await expect(page.locator('#cf-message')).toHaveValue('A single-line diagram editor for substations.');
    await expect(page.locator('[data-contact]')).toHaveAttribute('data-state', 'idle');
    await expect(alertBox(page)).toBeEmpty();
  });

  test('400 FIELD_NOT_IN_FORM_DEFINITION: the general error', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
    await openContact(page, json(400, { errors: [{ message: 'x', errorType: 'FIELD_NOT_IN_FORM_DEFINITION' }] }));
    await fillValid(page);
    await send(page);
    await expect(alertBox(page)).toContainText('Oops! Something went wrong while submitting the form.');
    await expect(page.locator('[data-contact]')).toHaveAttribute('data-state', 'failed');
    expect(errors.join(' ')).toContain('FIELD_NOT_IN_FORM_DEFINITION');
  });

  test('429: the rate limit message', async ({ page }) => {
    await openContact(page, json(429, {}));
    await fillValid(page);
    await send(page);
    await expect(alertBox(page)).toHaveText(
      'Too many messages were sent from here in a short time. Wait a minute and try again.'
    );
  });

  test('a network error keeps the data; sending again succeeds', async ({ page }) => {
    let online = false;
    const requests = await openContact(page, (route) => (online ? json(200, {})(route) : route.abort()));
    await fillValid(page);
    await send(page);
    await expect(alertBox(page)).toContainText('Your message is still here.');
    await expect(page.locator('#cf-name')).toHaveValue('Anna Maria Nowak');
    online = true;
    await send(page);
    await expect(doneTitle(page)).toBeFocused();
    await expect(alertBox(page)).toBeEmpty();
    expect(requests).toHaveLength(2);
  });

  test('while sending: busy, read-only, and a second click sends nothing', async ({ page }) => {
    let release: (() => void) | undefined;
    const requests = await openContact(
      page,
      (route) =>
        new Promise<void>((resolve) => {
          release = () => void Promise.resolve(json(200, {})(route)).then(resolve);
        })
    );
    await fillValid(page);
    await send(page);
    const button = page.locator('[data-contact-submit]');
    await expect(button).toHaveAttribute('aria-disabled', 'true');
    await expect(button).toHaveText('Sending…');
    await expect(page.locator('[data-contact-form]')).toHaveAttribute('aria-busy', 'true');
    await expect(page.locator('#cf-email')).toHaveJSProperty('readOnly', true);
    await expect(page.locator('[data-step][data-done]')).toHaveCount(3);
    // Playwright waits for an aria-disabled button to become enabled; force the click through.
    await button.click({ force: true });
    await page.keyboard.press('Enter');
    expect(requests).toHaveLength(1);
    release!();
    await expect(doneTitle(page)).toBeVisible();
    expect(requests).toHaveLength(1);
  });

  test('without a configured endpoint: the general error and no request', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
    const requests = await openContact(page);
    await page.evaluate(() => {
      document.querySelector<HTMLElement>('[data-contact-form]')!.dataset['endpoint'] = '';
    });
    await fillValid(page);
    await send(page);
    await expect(alertBox(page)).toContainText('Oops! Something went wrong while submitting the form.');
    expect(requests).toHaveLength(0);
    expect(errors.join(' ')).toContain('HUBSPOT_PORTAL_ID');
  });
});

test.describe('accessibility of the states (axe)', () => {
  for (const width of [390, 1440]) {
    test(`${width}px: errors, general error, success`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      let online = false;
      await openContact(page, (route) => (online ? json(200, {})(route) : route.abort()));
      await send(page);
      expect(await axeViolations(page), 'errors').toEqual([]);
      await fillValid(page);
      await send(page);
      await expect(alertBox(page)).not.toBeEmpty();
      expect(await axeViolations(page), 'general error').toEqual([]);
      online = true;
      await send(page);
      await expect(doneTitle(page)).toBeVisible();
      expect(await axeViolations(page), 'success').toEqual([]);
    });
  }
});

test.describe('keyboard', () => {
  test('Tab order: skip link, bar, intro links, fields, checkbox, privacy links, button', async ({ page }) => {
    await openContact(page);
    const stops: string[] = [];
    for (let step = 0; step < 40; step++) {
      await page.keyboard.press('Tab');
      const stop = await page.evaluate(() => {
        const active = document.activeElement as HTMLElement;
        return active.id || active.textContent?.replace(/\s+/g, ' ').trim() || active.tagName;
      });
      stops.push(stop);
      if (stop.startsWith('Send message')) {
        break;
      }
    }
    expect(stops[0]).toBe('Skip to main content');
    expect(stops[1]).toBe('ngDiagram');
    expect(stops).toContain('Talk to the team');
    const intro = stops.findIndex((stop) => stop.startsWith('Ask on Discord'));
    expect(intro).toBeGreaterThan(stops.indexOf('Talk to the team'));
    expect(stops.slice(intro)).toEqual([
      'Ask on Discord (opens in a new tab)',
      'cf-name',
      'cf-company',
      'cf-email',
      'cf-message',
      'cf-marketing',
      'Privacy policy (opens in a new tab)',
      'Privacy policy (opens in a new tab)',
      'Send message',
    ]);
  });

  test('Enter in a field sends the form; Space toggles the checkbox', async ({ page }) => {
    const requests = await openContact(page, json(200, {}));
    await fillValid(page);
    await page.locator('#cf-marketing').focus();
    await page.keyboard.press('Space');
    await expect(page.locator('#cf-marketing')).toBeChecked();
    await page.locator('#cf-company').focus();
    await page.keyboard.press('Enter');
    await expect(doneTitle(page)).toBeFocused();
    expect(requests).toHaveLength(1);
  });

  test('"Talk to the team" leads to the form and marks the current page', async ({ page }) => {
    await openContact(page);
    const cta = page.locator('.nav-cta');
    await expect(cta).toHaveAttribute('href', '#contact-form');
    await expect(cta).toHaveAttribute('aria-current', 'page');
    await expect(cta).not.toHaveAttribute('target', /.*/);
    await expect(page.locator('footer a[href="/contact"]')).toHaveAttribute('aria-current', 'page');
    await cta.focus();
    await page.keyboard.press('Enter');
    await expect.poll(() => page.evaluate(() => location.hash)).toBe('#contact-form');
    await expect
      .poll(() => page.evaluate(() => document.querySelector('#contact-form')!.getBoundingClientRect().top))
      .toBeLessThan(120);
  });
});

test('without JavaScript: the form shows, the button gives way to a Discord link', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.route(HUBSPOT, (route) => route.abort());
  await page.goto('/contact');
  await expect(page.locator('#cf-name')).toBeVisible();
  await expect(page.locator('[data-contact-submit]')).toBeHidden();
  await expect(page.locator('.contact-nojs')).toBeVisible();
  await expect(page.locator('.contact-nojs a')).toHaveAttribute('href', /discord/);
  expect(await measureOverflow(page)).toEqual({ page: 0, bars: [] });
  await context.close();
});

test('no request to another host while the page loads (O11)', async ({ page, baseURL }) => {
  const external: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== new URL(baseURL!).origin) {
      external.push(request.url());
    }
  });
  await openContact(page);
  await page.waitForLoadState('networkidle');
  expect(external).toEqual([]);
});

test('canonical URL without a trailing slash', async ({ page }) => {
  await openContact(page);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.ngdiagram.dev/contact');
  await expect(page).toHaveTitle(TITLE);
  await expect(page.locator('#contact-title')).toHaveText('Consulting for large-scale ngDiagram projects');
});

test.describe('links (O10, O14)', () => {
  for (const path of PAGES) {
    test(`${path}: ngdiagram.dev pages stay in the tab; other sites and demos open a new one, with ↗`, async ({
      page,
    }) => {
      await openLanding(page, path);
      const links = await page.$$eval('a[href]', (anchors: HTMLAnchorElement[]) =>
        anchors.map((anchor) => ({
          href: anchor.getAttribute('href')!,
          target: anchor.target,
          arrow: !!anchor.querySelector('use[href="#i-arrow"]'),
          said: `${anchor.textContent} ${anchor.getAttribute('aria-label') ?? ''}`.includes('(opens in a new tab)'),
          logo: !!anchor.querySelector('.icon-brand, .sc-logo'),
          video: anchor.hasAttribute('data-video'),
        }))
      );
      expect(links.length).toBeGreaterThan(20);
      for (const link of links) {
        // Videos play on the page; the YouTube address is only the way without JavaScript.
        if (link.video) {
          continue;
        }
        const url = new URL(link.href, 'https://www.ngdiagram.dev/');
        if (url.hostname === 'www.ngdiagram.dev' && !url.pathname.startsWith('/templates/')) {
          expect([link.target, link.arrow, link.said], link.href).toEqual(['', false, false]);
        } else {
          // Logos say where they lead, so they go without the arrow.
          expect([link.target, link.arrow || link.logo, link.said], link.href).toEqual(['_blank', true, true]);
        }
      }
    });
  }

  test('on the landing every contact link is /contact in the same tab', async ({ page }) => {
    await openLanding(page);
    const links = page.locator('a[href*="contact"]');
    await expect(links).toHaveCount(5);
    for (const link of await links.all()) {
      await expect(link).toHaveAttribute('href', '/contact');
      await expect(link).not.toHaveAttribute('target', /.*/);
      await expect(link).not.toHaveAttribute('aria-current', /.*/);
      await expect(link).not.toContainText('opens in a new tab');
    }
    await expect(page.locator('header .logo')).toHaveAttribute('href', '#main');
  });

  test('on the contact page the bar leads back to the landing', async ({ page }) => {
    await openContact(page);
    await expect(page.locator('header .logo')).toHaveAttribute('href', '/');
    await expect(page.locator('.nav-main a', { hasText: 'Templates' })).toHaveAttribute(
      'href',
      'https://www.ngdiagram.dev/docs/templates/'
    );
  });
});
