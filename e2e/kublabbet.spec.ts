import { expect, test, type Page } from '@playwright/test';
import { newHero } from './helpers';

// Kublabbet: kuben i 3D, att göra ett drag (rätt och fel), höger-tricket tills hörnet sitter,
// att trycka på en bit, vilket drag som gjordes och en lektion med en kub som spelar upp ett drag.

const shot = async (page: Page, name: string) => {
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${test.info().project.name}-k-${name}.png`, fullPage: true });
};

const NAMN: Record<string, string> = { U: 'Upp', D: 'Ner', R: 'Höger', L: 'Vänster', F: 'Fram', B: 'Bak' };
const knapp = (page: Page, d: string) =>
  page.getByRole('group', { name: 'Vrid kuben' }).getByRole('button', { name: `${d.replace("'", '′')}: ${NAMN[d[0]]}${d.endsWith("'") ? ', åt andra hållet' : ''}`, exact: true });
/** Mittpunkterna för klistermärkena på sidorna (i stora kuben). */
const mitten = (page: Page, sidor: string) => page.evaluate((sidor) => [...document.querySelectorAll<HTMLElement>('.kub-scen > .kub3d-ram .kub3d-dekal')]
  .filter((el) => sidor.includes('URFDLB'[Math.floor(Number(el.dataset.p) / 9)]))
  .map((el) => { const b = el.getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2] as [number, number]; }), sidor);
/** Hur många av sidornas klistermärken som träffas av ett tryck mitt på dem. */
const traffbara = (page: Page, sidor: string) => page.evaluate((sidor) => [...document.querySelectorAll<HTMLElement>('.kub-scen > .kub3d-ram .kub3d-dekal')]
  .filter((el) => sidor.includes('URFDLB'[Math.floor(Number(el.dataset.p) / 9)]))
  .filter((el) => { const b = el.getBoundingClientRect(); const h = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2); return h === el || h?.parentElement === el; }).length, sidor);
const ova = (page: Page, namn: RegExp) => page.getByRole('group', { name: 'Vad vill du öva på?' }).getByRole('button', { name: namn }).click();

test('Kublabbet: drag, höger-tricket, bitar och en lektion', async ({ page }) => {
  await newHero(page);
  await page.getByRole('button', { name: 'Robotön' }).click();
  await expect(page.getByRole('button', { name: /Kublabbet/ })).toBeVisible();

  await page.goto('./#/labb/kublabbet');
  await ova(page, /Vrid en sida/);
  await expect(page.locator('.kub3d .kub3d-dekal').first()).toBeVisible();
  await expect(page.locator('.kub3d-bit')).toHaveCount(26);
  await shot(page, '1-drag');

  // Ett fel drag visas, tas tillbaka och förklaras.
  const prompt = async () => (await page.locator('.drill-prompt').textContent())!.match(/draget (\S)/)![1];
  const d = await prompt();
  const fel = d === 'R' ? 'U' : 'R';
  await knapp(page, fel).click();
  await expect(page.locator('.errcard')).toBeVisible();
  await knapp(page, d).click();
  await expect(page.locator('.feedback.ok')).toBeVisible();
  await page.getByRole('button', { name: 'Nästa' }).click();

  // Rätt direkt, och mitt i animationen syns ett vridet lager.
  const d2 = await prompt();
  await knapp(page, d2).click();
  await page.waitForTimeout(150);
  await shot(page, '2-animation');
  await expect(page.locator('.feedback.ok')).toBeVisible();

  // Höger-tricket tills hörnet sitter (1, 3 eller 5 gånger).
  await ova(page, /Höger-tricket/);
  await shot(page, '3-horn');
  for (let i = 0; i < 5 && !(await page.locator('.feedback.ok').isVisible()); i++) {
    for (const m of ['R', 'U', "R'", "U'"]) await knapp(page, m).click();
    await page.waitForTimeout(1800);
  }
  await expect(page.locator('.feedback.ok')).toBeVisible();
  await shot(page, '4-horn-klart');

  // Tryck på en bit: varje synligt klistermärke går att träffa med ett riktigt tryck (inget osynligt ligger framför).
  await ova(page, /Mitt, kant och hörn/);
  await page.locator('.kub-scen').scrollIntoViewIfNeeded();
  expect(await traffbara(page, 'URF')).toBe(27);
  // Vrid kuben ett halvt varv: då går baksidan att trycka på, och "Rätt vy" vrider tillbaka.
  const box = (await page.locator('.kub-scen .kub3d').first().boundingBox())!;
  await page.mouse.move(box.x + 10, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 270, box.y + box.height / 2, { steps: 8 });
  await page.mouse.up();
  expect(await traffbara(page, 'B')).toBe(9);
  await page.getByRole('button', { name: '↺ Rätt vy' }).click();
  await expect(page.getByRole('button', { name: '↺ Rätt vy' })).toHaveCount(0);
  await page.waitForTimeout(600);
  // Tryck tills det blir rätt, med riktiga tryck på skärmen.
  for (const [x, y] of await mitten(page, 'URF')) {
    if (await page.locator('.feedback.ok').isVisible()) break;
    await page.mouse.click(x, y);
  }
  await expect(page.locator('.feedback.ok')).toBeVisible();
  await shot(page, '5-bit');

  // Vilket drag gjordes?
  await ova(page, /Vilket drag\?/);
  await page.waitForTimeout(1500);
  const val = page.getByRole('group', { name: 'Välj svar' }).getByRole('button');
  for (let i = 0; i < 4 && !(await page.locator('.feedback.ok').isVisible()); i++) await val.nth(i).click();
  await expect(page.locator('.feedback.ok')).toBeVisible();

  // Gula korset med topp-bilden.
  await ova(page, /Gula korset/);
  await expect(page.locator('.kub-toppbild')).toBeVisible();
  await shot(page, '6-gulkors');

  // En lektion: kuben spelar upp ett drag.
  await ova(page, /Vrid en sida/);
  await page.getByRole('button', { name: /Lektion: Dragen/ }).click();
  await expect(page.locator('.kub-film').first()).toBeVisible();
  await page.getByRole('button', { name: '▶ Spela' }).first().click();
  await page.waitForTimeout(250);
  await shot(page, '7-lektion');
  await expect(page.locator('.kub-bricka.klar')).toHaveCount(1, { timeout: 3000 });
});
