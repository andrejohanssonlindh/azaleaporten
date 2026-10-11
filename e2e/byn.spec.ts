import { expect, test, type Page } from '@playwright/test';
import { answer, newHero } from './helpers';

const shot = async (page: Page, name: string) => {
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${test.info().project.name}-b-${name}.png`, fullPage: true });
};

test('Biblioteket visar det man har övat på', async ({ page }) => {
  await newHero(page);
  await page.goto('./#/spela/tiokompisbron/tiokompisar');
  for (let i = 0; i < 10; i++) await answer(page, i === 0);
  await page.goto('./#/by');
  await page.getByRole('button', { name: /Biblioteket/ }).click();
  await expect(page.getByText('frågor', { exact: true })).toBeVisible();
  await page.locator('.shelf summary').first().click();
  await expect(page.locator('.skill-item').first()).toContainText('Tiokompisarna');
  await shot(page, '1-biblioteket');
  await page.goto('./#/smedjan');
  await expect(page.getByText('Sköldamulett', { exact: true })).toBeVisible();
});

test('Talbergens regionboss är låst tills tre Mästare är besegrade', async ({ page }) => {
  await newHero(page);
  await page.goto('./#/region/talbergen');
  await expect(page.locator('.region-boss.locked')).toContainText('(0/3)');
  await page.evaluate(() => {
    const id = JSON.parse(localStorage.getItem('azaleaporten:meta')!).heroes[0];
    const won = (boss: string) => JSON.stringify({ v: 1, stages: {}, bosses: { [boss]: { defeated: true, attempts: 1, wins: 1 } }, xp: 0 });
    localStorage.setItem(`azaleaporten:h:${id}:area:tiokompisbron`, won('brovaktaren'));
    localStorage.setItem(`azaleaporten:h:${id}:area:tabellgruvan`, won('gruvmastaren'));
    localStorage.setItem(`azaleaporten:h:${id}:area:myntmarknaden`, won('marknadsmastaren'));
  });
  await page.reload();
  await shot(page, '2-region');
  await page.locator('.region-boss').click();
  await expect(page.getByRole('heading', { name: 'Professor Pi' })).toBeVisible();
  await page.getByRole('button', { name: /Strid/ }).click();
  await expect(page.locator('.hpbar')).toBeVisible();
  await shot(page, '3-regionboss');
});
