import { expect, test, type Page } from '@playwright/test';
import { newHero } from './helpers';

const shot = async (page: Page, name: string) => {
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${test.info().project.name}-duel-${name}.png` });
};

test('Arenan: stegen, en pollett, röda banor, hoppa och slå', async ({ page }) => {
  await newHero(page);
  await page.evaluate(() => {
    const id = JSON.parse(localStorage.getItem('azaleaporten:meta')!).heroes[0];
    const k = `azaleaporten:h:${id}:hero`;
    localStorage.setItem(k, JSON.stringify({ ...JSON.parse(localStorage.getItem(k)!), polletter: 1, arena: { rank: 2, wins: 2 } }));
  });
  await page.goto('./#/by');
  await page.getByRole('button', { name: /Arenan/ }).click();
  await expect(page.locator('.duel-rung', { hasText: 'Krabban Klo' })).toBeEnabled();
  await expect(page.locator('.duel-rung', { hasText: 'Trollungen' })).toBeDisabled();
  await shot(page, '1-lobby');

  // Ett returmöte mot Grodkungen.
  await page.locator('.duel-rung', { hasText: 'Grodkungen' }).click();
  await page.getByRole('button', { name: /Mot 🐸 Grodkungen/ }).click();
  await expect(page.getByText('Sveper från sidorna')).toBeVisible();
  await page.getByRole('button', { name: /Strid!/ }).click();
  await expect(page.locator('.duel-lane.danger').first()).toBeVisible({ timeout: 4000 });
  await page.waitForTimeout(600);
  await shot(page, '2-wind');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowUp');
  await page.getByRole('button', { name: '⚔️ Slå' }).dispatchEvent('pointerdown');
  await page.waitForTimeout(1500);
  await shot(page, '3-later');
  const st = await page.evaluate(() => {
    const id = JSON.parse(localStorage.getItem('azaleaporten:meta')!).heroes[0];
    return JSON.parse(localStorage.getItem(`azaleaporten:h:${id}:hero`)!);
  });
  expect(st.polletter).toBe(0);
  expect(st.kastanjer).toBe(0);
});
