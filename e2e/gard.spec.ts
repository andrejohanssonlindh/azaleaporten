import { expect, test, type Page } from '@playwright/test';
import { answer, newHero, solve } from './helpers';

const shot = async (page: Page, name: string) => {
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${test.info().project.name}-g-${name}.png`, fullPage: true });
};

/** Lägger in några föremål (ett grått, ett sällsynt, ett vapen och en sköld) och kastanjer. */
async function seedGear(page: Page, wear = false) {
  await page.evaluate((wear) => {
    const id = JSON.parse(localStorage.getItem('azaleaporten:meta')!).heroes[0];
    const it = (n: number, base: string, slot: string, icon: string, rarity: number, stats: Record<string, number>, ilvl = 5) =>
      ({ id: `e2e-${n}`, base, slot, name: `Test${base}`, icon, rarity, ilvl, stats, plus: 0, foundAt: '' });
    const items = [
      it(1, 'svard', 'vapen', '🗡️', 2, { kraft: 6, snabbhet: 2 }, 9),
      it(2, 'skold', 'skold', '🛡️', 1, { skydd: 4 }),
      it(3, 'hjalm', 'huvud', '⛑️', 3, { skydd: 3, kraft: 3 }, 7),
      it(4, 'luva', 'huvud', '🧢', 0, { tur: 1 }),
      it(5, 'rustning', 'kropp', '🦺', 2, { skydd: 5 }, 8),
    ];
    localStorage.setItem(`azaleaporten:h:${id}:inventory`, JSON.stringify({ v: 1, items, equipped: wear ? { vapen: 'e2e-1', skold: 'e2e-2', huvud: 'e2e-3', kropp: 'e2e-5' } : {}, chests: [], pity: 0, capacity: 30, potions: { liv: 0 }, bonusHints: { day: '', n: 0 } }));
    const k = `azaleaporten:h:${id}:hero`;
    localStorage.setItem(k, JSON.stringify({ ...JSON.parse(localStorage.getItem(k)!), kastanjer: 300 }));
  }, wear);
}

test('utrustning: introduktion, figuren, smälta, Skräddaren och Arenan', async ({ page }) => {
  await newHero(page);
  await seedGear(page);
  await page.goto('./#/by');
  await expect(page.getByText(/Du har hittat utrustning!/)).toBeVisible();
  await shot(page, '1-intro');
  await page.getByRole('button', { name: 'Visa mig!' }).click();
  await expect(page.getByRole('heading', { name: /Azaleagården/ })).toBeVisible();

  // Utrustningen sitter direkt ovanför packningen.
  for (const n of ['Testsvard', 'Testskold', 'Testhjalm', 'Testrustning']) {
    await page.locator('.item-card', { hasText: n }).getByRole('button', { name: 'Använd' }).click();
  }
  await expect(page.getByRole('button', { name: 'Ta av' })).toHaveCount(4);
  await page.getByRole('button', { name: /Kraft/ }).click();
  await expect(page.locator('.stat-explain')).toContainText('skada');
  await shot(page, '2-hjalten');

  await page.getByRole('button', { name: /Smält alla gråa/ }).click();
  await page.getByRole('button', { name: 'Ja, smält' }).click();
  await expect(page.locator('.item-card', { hasText: 'Testluva' })).toHaveCount(0);

  // Introduktionen visas bara en gång.
  await page.goto('./#/by');
  await expect(page.getByText(/Du har hittat utrustning!/)).toHaveCount(0);

  await page.getByRole('button', { name: /Skräddaren/ }).click();
  await page.locator('.shop-row', { hasText: 'Trollkarlshatt' }).getByRole('button', { name: 'Prova' }).click();
  await shot(page, '3-prova');
  await page.locator('.shop-row', { hasText: 'Röd mantel' }).getByRole('button', { name: '50 🌰' }).click();
  await page.locator('.shop-row', { hasText: 'Ängen' }).getByRole('button', { name: '40 🌰' }).click();
  await expect(page.locator('.shop-row', { hasText: 'Röd mantel' })).toContainText('Har på dig');

  await page.goto('./#/gard');
  await page.getByRole('tab', { name: 'Garderoben' }).click();
  await expect(page.getByRole('button', { name: /Röd mantel/ })).toHaveAttribute('aria-pressed', 'true');
  await shot(page, '4-garderob');
  await page.getByRole('tab', { name: 'Kunskaper' }).click();
  await expect(page.getByRole('heading', { name: /Kunskaper/ })).toBeVisible();

  await page.goto('./#/arenan');
  await page.getByRole('button', { name: /Köp pollett/ }).click();
  await page.getByRole('button', { name: /Mot 🌾 Halmdockan/ }).click();
  await page.getByRole('button', { name: /Strid!/ }).click();
  await page.getByRole('button', { name: '⚔️ Slå' }).dispatchEvent('pointerdown');
  await expect(page.locator('.duel-fx').first()).toContainText('Blockerat');
  await shot(page, '5-arenan');
});

test('stigmonster i en vanlig bana', async ({ page }) => {
  await newHero(page);
  await seedGear(page, true);
  await page.goto('./#/region/talbergen');
  await page.getByRole('button', { name: /Tiokompisbron/ }).click();
  await page.getByRole('button', { name: /Spela: Tiokompisar/ }).click();
  await expect(page.locator('.mob-strip')).toBeVisible();
  for (let i = 0; i < 10; i++) {
    await answer(page);
    if (i === 4) await shot(page, '6-stigmonster');
  }
  await expect(page.getByText(/stigmonster besegrade/)).toBeVisible();
  await shot(page, '7-resultat');

  // Bossintrot visar vad utrustningen gör.
  await page.goto('./#/spela/tiokompisbron/tiotapparen');
  await expect(page.locator('.boss-rules')).toContainText('träffar');
  await shot(page, '8-bossintro');
  await page.getByRole('button', { name: /Strid!/ }).click();
  await page.getByLabel('Ditt svar').fill(String(await solve(page)));
  await page.getByRole('button', { name: 'Rätta' }).click();
  await expect(page.locator('.boss-hud .hit')).toBeVisible();
  await shot(page, '9-bosstraff');
});
