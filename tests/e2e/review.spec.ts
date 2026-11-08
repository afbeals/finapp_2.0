import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

async function jsonPost(request: APIRequestContext, url: string, data: unknown) {
  const response = await request.post(url, { data });
  expect(response.ok(), `${url}: ${await response.text()}`).toBeTruthy();
  return response.json();
}

async function login(page: Page) {
  const { members } = await (await page.request.get('/api/households/members')).json();
  await jsonPost(page.request, '/api/auth/login', { memberId: members[0].id, pin: '1234' });
  return members as { id: number; name: string }[];
}

test('copy preserves ownership, highlights only this visit, and allows unchanged entries', async ({ page, isMobile }, info) => {
  const members = await login(page);
  const year = 2080 + ['chromium', 'mobile-chromium', 'mobile-webkit'].indexOf(info.project.name);
  const { review: previous } = await jsonPost(page.request, '/api/reviews', { periodYear: year, periodMonth: 12, type: 'MONTHLY' });
  const { review: current } = await jsonPost(page.request, '/api/reviews', { periodYear: year + 1, periodMonth: 1, type: 'MONTHLY' });
  const { categories } = await (await page.request.get('/api/config/categories')).json();
  const category = categories[0];
  await jsonPost(page.request, `/api/reviews/${previous.id}/income`, { name: 'Copied salary', memberId: members[1].id, amount: 123456 });
  for (const [name, memberId] of [['Personal groceries', members[1].id], ['Shared groceries', null]]) {
    await jsonPost(page.request, `/api/reviews/${previous.id}/expenses`, { categoryId: category.id, memberId, name, amount: 23456, date: `${year}-12-15` });
  }
  const expensePath = `/review/${current.id}/expense`;
  await page.goto(expensePath);
  await page.getByRole('button', { name: /Copy from Previous Month/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText(members[1].name, { exact: true })).toHaveCount(2);
  await expect(dialog.getByText('Shared', { exact: true })).toBeVisible();
  for (const checkbox of await dialog.getByRole('checkbox').all()) await checkbox.check();
  await dialog.getByRole('button', { name: 'Copy 3 Selected' }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole('button', { name: new RegExp(category.name) }).click();
  const personal = page.locator('tr').filter({ hasText: 'Personal groceries' });
  const shared = page.locator('tr').filter({ hasText: 'Shared groceries' });
  const salary = page.locator('tr').filter({ hasText: 'Copied salary' });
  await expect(personal).toHaveAttribute('title', 'Copied from previous month');
  await expect(shared).toHaveAttribute('title', 'Copied from previous month');
  await expect(salary).toHaveAttribute('title', 'Copied from previous month');
  await personal.locator('[title="Click to edit"]').first().click();
  if (isMobile) expect(await page.getByRole('textbox').evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
  await page.getByRole('textbox').fill('Changed groceries');
  await page.getByRole('textbox').press('Enter');
  await expect(personal).toHaveCount(0);
  const changed = page.locator('tr').filter({ hasText: 'Changed groceries' });
  await expect(changed).not.toHaveAttribute('title', 'Copied from previous month');
  expect(await changed.evaluate(el => getComputedStyle(el).backgroundColor)).not.toEqual(await shared.evaluate(el => getComputedStyle(el).backgroundColor));
  const saved = await (await page.request.get(`/api/reviews/${current.id}/expenses`)).json();
  expect(saved.entries.find((e: { name: string }) => e.name === 'Shared groceries').member).toBeNull();
  expect(saved.entries.find((e: { name: string }) => e.name === 'Changed groceries').member.id).toBe(members[1].id);
  await page.getByRole('button', { name: 'Next Step →' }).click();
  await expect(page).toHaveURL(`/review/${current.id}/monthly`);
  await page.goto(expensePath);
  await expect(page.locator('[title="Copied from previous month"]')).toHaveCount(0);
  await page.getByRole('button', { name: new RegExp(category.name) }).click();
  await expect(page.locator('tr').filter({ hasText: 'Shared groceries' })).toBeVisible();
  await page.reload();
  await expect(page.locator('[title="Copied from previous month"]')).toHaveCount(0);
  await page.goto(`/review/${current.id}/finalize`);
  await page.getByRole('button', { name: 'Complete Review ✓' }).click();
  await expect(page).toHaveURL('/dashboard');
  const { review: completed } = await (await page.request.get(`/api/reviews/${current.id}`)).json();
  expect(completed.status).toBe('COMPLETE');
  await page.goto(`/history/${current.id}`);
  await expect(page.getByRole('heading', { name: new RegExp(`January ${year + 1}`) })).toBeVisible();
});

test('all review screens and household pages fit narrow and wide viewports', async ({ page }, info) => {
  test.setTimeout(120000);
  await login(page);
  const { reviews } = await (await page.request.get('/api/reviews')).json();
  const review = reviews.find((r: { type: string; status: string }) => r.type === 'QUARTERLY' && r.status !== 'COMPLETE') ?? reviews[0];
  const completed = reviews.find((r: { status: string }) => r.status === 'COMPLETE');
  const routes = ['/dashboard', '/config', ...['expense', 'monthly', 'savings', 'loans', 'investments', 'portfolio', 'vaults', 'finalize'].map(step => `/review/${review.id}/${step}`)];
  if (completed) routes.push(`/history/${completed.id}`);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      const response = await page.goto(route);
      expect([200, 304], route).toContain(response?.status());
      await expect(page.getByRole('heading').first()).toBeVisible();
      await page.waitForLoadState('networkidle');
      if (route.endsWith('/investments') && width === 320) {
        const accounts = page.getByRole('button', { name: /Balance.*Growth/ });
        expect(await accounts.count()).toBeGreaterThan(0);
        for (const account of await accounts.all()) {
          const overflow = await account.evaluate(el => {
            const childrenRight = Math.max(...[...el.children].map(child => child.getBoundingClientRect().right));
            return childrenRight - el.getBoundingClientRect().right;
          });
          expect(overflow, 'Account details stay inside the card').toBeLessThanOrEqual(1);
        }
        await accounts.first().click();
        await expect(accounts.first()).toHaveAttribute('aria-expanded', 'true');
        await expect(page.getByRole('region', { name: /balance history/ }).first()).toBeVisible();
      }
      const actualWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      if (actualWidth > width + 1) console.log(route, width, await page.evaluate(() => [...document.querySelectorAll('body *')].filter(el => el.getBoundingClientRect().right > innerWidth + 1).slice(-12).map(el => ({ tag: el.tagName, class: el.className, text: el.textContent?.slice(0, 65), width: el.getBoundingClientRect().width }))));
      expect.soft(actualWidth, `${route} at ${width}px`).toBeLessThanOrEqual(width + 1);
      if (width === 390) await page.screenshot({ path: info.outputPath(`${route.replaceAll('/', '-')}.png`), fullPage: true });
    }
  }
});
