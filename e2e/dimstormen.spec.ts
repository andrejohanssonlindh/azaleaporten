import { expect, test, type Page } from '@playwright/test';
import { newHero } from './helpers';

const shot = async (page: Page, name: string) => {
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${test.info().project.name}-storm-${name}.png` });
};

test('Dimstormen: en pollett, spring runt, välj en kraft, avsluta och få blad', async ({ page }) => {
  await newHero(page);
  await page.evaluate(() => {
    const id = JSON.parse(localStorage.getItem('azaleaporten:meta')!).heroes[0];
    const k = (s: string) => `azaleaporten:h:${id}:${s}`;
    const hero = JSON.parse(localStorage.getItem(k('hero'))!);
    localStorage.setItem(k('hero'), JSON.stringify({ ...hero, polletter: 2 }));
    const item = (id: string, base: string, slot: string, icon: string, stats: object) => ({ id, base, slot, name: 'Test', icon, rarity: 2, ilvl: 3, stats, plus: 0, foundAt: '' });
    const inv = JSON.parse(localStorage.getItem(k('inventory'))!);
    localStorage.setItem(k('inventory'), JSON.stringify({
      ...inv,
      items: [item('v1', 'svard', 'vapen', '🗡️', { kraft: 4, snabbhet: 3 }), item('s1', 'trollbok', 'skold', '📕', { visdom: 6 }), item('p1', 'husdjur', 'husdjur', '🐸', { tur: 3 })],
      equipped: { vapen: 'v1', skold: 's1', husdjur: 'p1' },
    }));
  });
  await page.goto('./#/by');
  await page.getByRole('button', { name: /Dimstormen/ }).click();
  await expect(page.getByText('Svärd', { exact: true })).toBeVisible();
  await expect(page.getByText('Trollbok', { exact: true })).toBeVisible();
  await shot(page, '1-lobby');

  await page.getByRole('button', { name: /Starta steg 1/ }).click();
  await expect(page.getByRole('button', { name: /Kör/ })).toBeVisible();
  await shot(page, '2-intro');
  await page.getByRole('button', { name: /Kör/ }).click();

  // Spring i en cirkel tills första kraften erbjuds.
  const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];
  const card = page.locator('.storm-card').first();
  for (let i = 0; i < 40 && !(await card.isVisible()); i++) {
    await page.keyboard.down(keys[i % 4]);
    await page.waitForTimeout(600);
    await page.keyboard.up(keys[i % 4]);
    if (i === 3) await shot(page, '3-play');
  }
  await expect(card).toBeVisible();
  await shot(page, '4-choose');
  await card.click();
  await page.waitForTimeout(4000);
  await shot(page, '5-later');

  await page.getByRole('button', { name: 'Pausa' }).click();
  await page.getByRole('button', { name: 'Avsluta stormen' }).click();
  await expect(page.locator('.result-card')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('.result-card')).toContainText('🌸');
  await shot(page, '6-result');
  const hero = await page.evaluate(() => {
    const id = JSON.parse(localStorage.getItem('azaleaporten:meta')!).heroes[0];
    return JSON.parse(localStorage.getItem(`azaleaporten:h:${id}:hero`)!);
  });
  expect(hero.polletter).toBe(1);
  expect(hero.kastanjer).toBe(0);
});
