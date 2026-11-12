import { expect, test, type Page } from '@playwright/test';
import { openLanding, PAGES, waitForHeroSettled } from './support';

const activeInfo = (page: Page) =>
  page.evaluate(() => {
    const active = document.activeElement as HTMLElement | null;
    return {
      text: active?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
      className: active?.className ?? '',
      inDiagram: !!active?.closest('[data-hero-diagram]'),
      inPage: !!active?.closest('main, footer'),
    };
  });

const canvasTransform = (page: Page) =>
  page.evaluate(() => document.querySelector<HTMLElement>('ng-diagram-canvas')?.style.transform ?? '');

test.describe('page and hero diagram (1440px)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openLanding(page);
    expect(await waitForHeroSettled(page)).toBe('live');
  });

  test('the skip link is the first Tab stop and moves focus to main', async ({ page }) => {
    await page.keyboard.press('Tab');
    expect((await activeInfo(page)).text).toBe('Skip to main content');
    await page.keyboard.press('Enter');
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('main');
  });

  test('no Tab stop inside the diagram (O4)', async ({ page }) => {
    // Every stop from the skip link to the end of the hero.
    for (let step = 0; step < 15; step++) {
      await page.keyboard.press('Tab');
      expect((await activeInfo(page)).inDiagram).toBe(false);
    }
  });

  test('after a click on a node, arrows scroll the page and Delete removes nothing (O4)', async ({ page }) => {
    const nodes = page.locator('ng-diagram-node');
    const count = await nodes.count();
    expect(count).toBeGreaterThan(0);
    // A workflow node; the first node is a group whose centre is covered by its children.
    await page.locator('ng-diagram-node[data-node-id="wait-interval"]').click();
    await expect.poll(() => page.evaluate(() => !!document.activeElement?.closest('ng-diagram'))).toBe(true);

    const before = await page.evaluate(() => window.scrollY);
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before);

    await page.keyboard.press('Delete');
    await page.keyboard.press('Backspace');
    await expect(nodes).toHaveCount(count);
  });

  test('Ctrl + wheel over the hero does not zoom the diagram (O4)', async ({ page }) => {
    const box = (await page.locator('.hero-stage').boundingBox())!;
    const before = await canvasTransform(page);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.keyboard.down('Control');
    await page.mouse.wheel(0, -300);
    await page.mouse.wheel(0, 300);
    await page.keyboard.up('Control');
    await page.waitForTimeout(200);
    expect(await canvasTransform(page)).toBe(before);
  });
});

for (const path of PAGES) {
  test.describe(`${path} menu (390px)`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await openLanding(page, path);
    });

    const menuState = (page: Page) =>
      page.evaluate(() => ({
        expanded: document.querySelector('.nav-toggle')?.getAttribute('aria-expanded'),
        open: document.querySelector('header')?.classList.contains('nav-open'),
        inert: [...document.querySelectorAll<HTMLElement>('main, footer, .skip-main')].map((element) => element.inert),
      }));

    test('opens, keeps Tab in the header, closes on Escape with focus on the button', async ({ page }) => {
      await page.click('.nav-toggle');
      expect(await menuState(page)).toEqual({ expanded: 'true', open: true, inert: [true, true, true] });
      for (let step = 0; step < 20; step++) {
        await page.keyboard.press('Tab');
        expect((await activeInfo(page)).inPage).toBe(false);
      }
      await page.keyboard.press('Escape');
      expect(await menuState(page)).toEqual({ expanded: 'false', open: false, inert: [false, false, false] });
      expect((await activeInfo(page)).className).toContain('nav-toggle');
    });

    test('the page behind the open menu does not scroll', async ({ page }) => {
      await page.click('.nav-toggle');
      await page.mouse.move(195, 600);
      await page.mouse.wheel(0, 800);
      await page.waitForTimeout(300);
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
    });

    // The landing's one in-page link in the header is the logo (the menu links lead to the docs).
    if (path === '/') {
      test('an in-page link in the header closes the menu and goes to its target', async ({ page }) => {
        await page.mouse.wheel(0, 600);
        await page.click('.nav-toggle');
        await page.locator('header .logo').click();
        expect((await menuState(page)).open).toBe(false);
        await expect.poll(() => page.evaluate(() => location.hash)).toBe('#main');
      });
    }

    test('growing past 64em closes the menu', async ({ page }) => {
      await page.click('.nav-toggle');
      await page.setViewportSize({ width: 1100, height: 844 });
      await expect.poll(async () => (await menuState(page)).open).toBe(false);
      expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
    });
  });
}

test.describe('tabs, segment and copy (1440px)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openLanding(page);
  });

  test('template tabs: arrows wrap, Home and End, one Tab stop, one visible panel', async ({ page }) => {
    const state = () =>
      page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('.tpl-tab')]
          .map((tab) => {
            const panel = document.getElementById(tab.getAttribute('aria-controls') ?? '');
            return `${tab.getAttribute('aria-selected') === 'true' ? 'S' : '-'}${tab.tabIndex}${panel?.hidden ? 'h' : 'v'}`;
          })
          .join(' ')
      );
    await page.locator('.tpl-tab').nth(1).click();
    expect(await state()).toBe('--1h S0v');
    await page.keyboard.press('ArrowRight');
    expect(await state()).toBe('S0v --1h');
    await page.keyboard.press('ArrowRight');
    expect(await state()).toBe('--1h S0v');
    await page.keyboard.press('ArrowLeft');
    expect(await state()).toBe('S0v --1h');
    await page.keyboard.press('End');
    expect(await state()).toBe('--1h S0v');
    await page.keyboard.press('Home');
    expect(await state()).toBe('S0v --1h');
    expect((await activeInfo(page)).className).toContain('tpl-tab');
  });

  test('the Engineering row: the buttons page, stop at the ends and say where the row is (O2)', async ({ page }) => {
    const row = page.locator('#tpl-scroller-engineering');
    const previous = page.getByRole('button', { name: 'Previous templates' });
    const next = page.getByRole('button', { name: 'Next templates' });
    await expect(previous).toHaveAttribute('aria-disabled', 'true');
    await expect(next).toHaveAttribute('aria-disabled', 'false');

    await next.click();
    await expect.poll(() => row.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    await expect(next).toHaveAttribute('aria-disabled', 'true');
    await expect(previous).toHaveAttribute('aria-disabled', 'false');
    await expect(page.locator('[data-announcer]')).toHaveText('Templates 2–4 of 4');
    // A press on a button at its end does nothing. Playwright waits for an aria-disabled button to
    // become enabled; force the click through.
    await next.click({ force: true });
    await expect(next).toHaveAttribute('aria-disabled', 'true');
    expect(await row.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);

    await previous.click();
    await expect.poll(() => row.evaluate((element) => element.scrollLeft)).toBe(0);
    await expect(previous).toHaveAttribute('aria-disabled', 'true');
  });

  test('the row skip link moves focus to the row controls', async ({ page }) => {
    const skip = page.locator('#templates .skip-row');
    // The mockup's wording; the resources row says the same of its cards.
    await expect(skip).toHaveText('Skip to template controls');
    await expect(page.locator('#resources .skip-row')).toHaveText('Skip to video and article controls');
    await skip.focus();
    await expect(skip).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page.locator('#tpl-scroller-engineering-controls')).toBeFocused();
  });

  test('a video plays in a dialog: focus moves in, Escape closes and returns focus (O9)', async ({ page }) => {
    const youtube: string[] = [];
    await page.route(/youtube|ytimg|googlevideo/, (route) => {
      youtube.push(route.request().url());
      return route.fulfill({ status: 200, contentType: 'text/html', body: '<p>player</p>' });
    });
    const watch = page.getByRole('button', { name: /^Watch here\W+Project setup: your first diagram in Angular$/ });
    await watch.focus();
    expect(youtube).toEqual([]);

    await page.keyboard.press('Space');
    const dialog = page.getByRole('dialog', { name: 'Project setup: your first diagram in Angular' });
    await expect(dialog).toBeVisible();
    await expect(page.getByRole('button', { name: 'Close the video' })).toBeFocused();
    await expect(dialog.locator('iframe')).toHaveAttribute(
      'src',
      'https://www.youtube-nocookie.com/embed/Ck_lPtyKE_Q?autoplay=1&rel=0'
    );

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page.locator('[data-video-frame] iframe')).toHaveCount(0);
    await expect(watch).toBeFocused();
  });

  test('the FAQ answers open and close from the keyboard', async ({ page }) => {
    const question = page.locator('.faq-item summary').first();
    await question.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.faq-item').first()).toHaveAttribute('open', '');
    await page.keyboard.press('Space');
    await expect(page.locator('.faq-item').first()).not.toHaveAttribute('open', '');
  });

  test('package manager segment: click and arrows change the command', async ({ page }) => {
    const code = page.locator('#installCode');
    await page.locator('.pm-seg[data-pm="pnpm"]').click();
    await expect(code).toHaveText('pnpm add ng-diagram');
    await page.keyboard.press('ArrowDown');
    await expect(code).toHaveText('yarn add ng-diagram');
    await page.keyboard.press('End');
    await expect(code).toHaveText('bun add ng-diagram');
    await page.keyboard.press('Home');
    await expect(code).toHaveText('npm install ng-diagram');
    await expect(page.locator('.pm-seg[aria-checked="true"]')).toHaveAttribute('tabindex', '0');
    await expect(page.locator('.pm-seg[tabindex="0"]')).toHaveCount(1);
  });

  test('copy: "Copied" and an announcement after a real copy', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const button = page.locator('button[data-copy="#installCode"]');
    await expect(button).toHaveAccessibleName('Copy install command');
    await button.click();
    await expect(button.locator('[data-copy-text]')).toHaveText('Copied');
    await expect(page.locator('[data-announcer]')).toHaveText('Copied the install command.');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('npm install ng-diagram');
    await expect(button.locator('[data-copy-text]')).toHaveText('Copy', { timeout: 3000 });

    await page.locator('button[data-copy="#componentCode"]').click();
    const component = await page.evaluate(() => navigator.clipboard.readText());
    expect(component.startsWith("import { Component } from '@angular/core';")).toBe(true);
    expect(component).not.toContain('<span');
  });

  test('copy: a blocked clipboard selects the code and says how to copy it', async ({ page }) => {
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: () => Promise.reject(new Error('blocked')) },
      });
    });
    const button = page.locator('button[data-copy="#stylesCode"]');
    await button.click();
    await expect(page.locator('[data-announcer]')).toHaveText(/^Copying is blocked\. The styles import is selected/);
    await expect(button.locator('[data-copy-text]')).toHaveText('Copy');
    const selected = await page.evaluate(() => String(window.getSelection()));
    expect(selected).toBe(await page.locator('#stylesCode').textContent());
  });

  test('a code block is a Tab stop only while it scrolls sideways (O9)', async ({ page }) => {
    const stops = () =>
      page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('.code pre')].map((pre) => ({
          scrolls: pre.scrollWidth > pre.clientWidth,
          focusable: pre.getAttribute('tabindex') === '0',
        }))
      );
    for (const block of await stops()) {
      expect(block.focusable).toBe(block.scrolls);
    }
    await page.setViewportSize({ width: 360, height: 800 });
    await expect.poll(async () => (await stops()).some((block) => block.focusable)).toBe(true);
    for (const block of await stops()) {
      expect(block.focusable).toBe(block.scrolls);
    }
  });
});

test.describe('paging rows below 45em (O17)', () => {
  const displays = (page: Page, selector: string) =>
    page.$$eval(selector, (elements) => elements.map((element) => getComputedStyle(element).display));

  test('with a mouse: the buttons and the skip link stay, and a press pages one card', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openLanding(page);
    const row = page.locator('#tpl-scroller-engineering');
    const next = page.getByRole('button', { name: 'Next templates' });
    await expect(next).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next videos and articles' })).toBeVisible();

    await next.click();
    await expect.poll(() => row.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    // One card fits, so the position names it alone.
    await expect(page.locator('[data-announcer]')).toHaveText('Templates 2 of 4');

    const skip = page.locator('#templates .skip-row');
    await skip.focus();
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#tpl-scroller-engineering-controls')).toBeFocused();
  });

  test('on a touch-only phone: the buttons and the skip link go, and the row still scrolls', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const page = await context.newPage();
    await openLanding(page);
    expect(new Set(await displays(page, '.tpl-foot, .skip-row'))).toEqual(new Set(['none']));
    for (const id of ['#tpl-scroller-engineering', '#res-scroller']) {
      expect(await page.locator(id).evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
    }
    await context.close();
  });
});

test('without JavaScript: every panel, no script-only controls, a static menu', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/');
  const displays = (selector: string) =>
    page.$$eval(selector, (elements) => elements.map((element) => getComputedStyle(element).display));
  expect(await displays('.tpl-panel')).not.toContain('none');
  expect(new Set(await displays('.tpl-tabs, .pm-switch, .copy, .nav-toggle, .tpl-foot, .skip-row'))).toEqual(
    new Set(['none'])
  );
  await expect(page.locator('.nav-menu .nav-main a').first()).toBeVisible();
  // Without the dialog, a video link still leads to the video.
  await expect(page.locator('.res .links [data-video]').first()).toHaveAttribute(
    'href',
    'https://www.youtube.com/watch?v=Ck_lPtyKE_Q'
  );
  await context.close();
});
