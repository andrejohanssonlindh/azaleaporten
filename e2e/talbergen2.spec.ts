import { expect, test, type Page } from '@playwright/test';
import { newHero } from './helpers';

const shot = async (page: Page, name: string) => {
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${test.info().project.name}-n-${name}.png`, fullPage: true });
};

/** Öppnar en bana direkt och svarar fel en gång (förklaringen ska visas). */
async function tryStage(page: Page, area: string, stage: string, name: string) {
  await page.goto(`./#/spela/${area}/${stage}`);
  await expect(page.locator('.eq')).toBeVisible();
  await shot(page, `${name}-fraga`);
  const choice = page.locator('.drill-choice:not([disabled])').first();
  if (await choice.isVisible()) {
    for (let i = 0; i < 3 && !(await page.locator('.next-btn').isVisible()); i++) await page.locator('.drill-choice:not([disabled])').first().click();
  } else {
    await page.getByLabel('Ditt svar').fill('99999');
    await page.getByRole('button', { name: 'Rätta' }).click();
    await expect(page.locator('.errcard')).toBeVisible();
  }
  await shot(page, `${name}-svar`);
}

test('de nya områdena i Talbergen går att öppna och spela', async ({ page }) => {
  await newHero(page);
  await page.getByRole('button', { name: 'Talbergen' }).click();
  await expect(page.locator('.area-open')).toHaveCount(6);
  await shot(page, '0-talbergen');
  // Lås upp banorna genom att låtsas att allt före är klart.
  await page.evaluate(() => {
    const id = JSON.parse(localStorage.getItem('azaleaporten:meta')!).heroes[0];
    const st = { stars: 1, cleared: true, best: 9, runs: 1 };
    const all = (ids: string[]) => JSON.stringify({ v: 1, stages: Object.fromEntries(ids.map((x) => [x, st])), bosses: {}, xp: 0 });
    localStorage.setItem(`azaleaporten:h:${id}:area:myntmarknaden`, all(['mynten', 'sma-inkop', 'vaxel-pa-tian']));
    localStorage.setItem(`azaleaporten:h:${id}:area:tallinjebron`, all(['tal-till-20', 'tal-till-100', 'avrunda-tiotal', 'tal-till-1000', 'avrunda-hundratal']));
  });
  await tryStage(page, 'myntmarknaden', 'mynten', 'mynt');
  await tryStage(page, 'myntmarknaden', 'vaxel-pa-tian', 'vaxel');
  await tryStage(page, 'tallinjebron', 'tal-till-100', 'tallinje');
  await tryStage(page, 'tallinjebron', 'avrunda-tiotal', 'avrunda');
  await tryStage(page, 'brakbageriet', 'halvor-och-fjardedelar', 'brak');
  await tryStage(page, 'brakbageriet', 'samma-bitar', 'jamfor');
  await page.goto('./#/labb/tallinjebron');
  await page.getByRole('button', { name: /Termometern/ }).click();
  await expect(page.getByRole('button', { name: 'Byt tecken' })).toBeVisible();
  await shot(page, 'termometer');
  await page.goto('./#/labb/brakbageriet');
  await page.getByRole('button', { name: /Lägg ihop bitar/ }).click();
  await expect(page.locator('.eq-frac')).toHaveCount(3);
  await shot(page, 'addera');
});
